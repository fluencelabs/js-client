/*
 * Copyright 2020 Fluence Labs Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as PeerId from 'peer-id';
import Multiaddr from 'multiaddr';
import { FluenceConnection, FluenceConnectionOptions } from './FluenceConnection';

import { PeerIdB58 } from './commonTypes';
import { FluenceClient } from '../FluenceClient';
import { RequestFlow } from './RequestFlow';
import { CallServiceHandler } from './CallServiceHandler';
import { loadRelayFn, loadVariablesService } from './RequestFlowBuilder';
import { logParticle, Particle } from './particle';
import log from 'loglevel';
import {
    AirInterpreter,
    ParticleHandler,
    SecurityTetraplet,
    CallServiceResult,
    LogLevel as AvmLogLevel,
} from '@fluencelabs/avm';
import makeDefaultClientHandler from './defaultClientHandler';

const createClient = (handler, peerId): Promise<AirInterpreter> => {
    let logLevel: AvmLogLevel = 'off';
    switch (log.getLevel()) {
        case 0: // 'TRACE'
            logLevel = 'trace';
            break;
        case 1: // 'DEBUG'
            logLevel = 'debug';
            break;
        case 2: // 'INFO'
            logLevel = 'info';
            break;
        case 3: // 'WARN'
            logLevel = 'warn';
            break;
        case 4: // 'ERROR'
            logLevel = 'error';
            break;
        case 5: // 'SILENT'
            logLevel = 'off';
            break;
    }
    const logFn = (level: AvmLogLevel, msg: string) => {
        switch (level) {
            case 'error':
                log.error(msg);
                break;

            case 'warn':
                log.warn(msg);
                break;

            case 'info':
                log.info(msg);
                break;

            case 'debug':
            case 'trace':
                log.log(msg);
                break;
        }
    };
    return AirInterpreter.create(handler, peerId, logLevel, logFn);
};

export class ClientImpl implements FluenceClient {
    readonly selfPeerIdFull: PeerId;

    private requests: Map<string, RequestFlow> = new Map();
    private currentRequestId: string | null = null;
    private watchDog;

    get relayPeerId(): PeerIdB58 | undefined {
        return this.connection?.nodePeerId.toB58String();
    }

    get selfPeerId(): PeerIdB58 {
        return this.selfPeerIdFull.toB58String();
    }

    get isConnected(): boolean {
        return this.connection?.isConnected();
    }

    private connection: FluenceConnection;
    private interpreter: AirInterpreter;

    constructor(selfPeerIdFull: PeerId) {
        this.selfPeerIdFull = selfPeerIdFull;
        this.callServiceHandler = makeDefaultClientHandler();
    }

    callServiceHandler: CallServiceHandler;

    async disconnect(): Promise<void> {
        if (this.connection) {
            await this.connection.disconnect();
        }
        this.clearWathcDog();
        this.requests.forEach((r) => {
            r.cancel();
        });
    }

    async initAirInterpreter(): Promise<void> {
        this.interpreter = await createClient(this.interpreterCallback.bind(this), this.selfPeerId);
    }

    async connect(multiaddr: string | Multiaddr, options?: FluenceConnectionOptions): Promise<void> {
        multiaddr = Multiaddr(multiaddr);

        const nodePeerId = multiaddr.getPeerId();
        if (!nodePeerId) {
            throw Error("'multiaddr' did not contain a valid peer id");
        }

        if (this.connection) {
            await this.connection.disconnect();
        }

        const node = PeerId.createFromB58String(nodePeerId);
        const connection = new FluenceConnection(
            multiaddr,
            node,
            this.selfPeerIdFull,
            this.executeIncomingParticle.bind(this),
        );
        await connection.connect(options);
        this.connection = connection;
        this.initWatchDog();
    }

    async initiateFlow(request: RequestFlow): Promise<void> {
        // setting `relayVariableName` here. If the client is not connected (i.e it is created as local) then there is no relay
        request.handler.on(loadVariablesService, loadRelayFn, () => {
            return this.relayPeerId || '';
        });
        await request.initState(this.selfPeerIdFull);

        logParticle(log.debug, 'executing local particle', request.getParticle());
        request.handler.combineWith(this.callServiceHandler);
        this.requests.set(request.id, request);

        this.processRequest(request);
    }

    async executeIncomingParticle(particle: Particle) {
        logParticle(log.debug, 'external particle received', particle);

        let request = this.requests.get(particle.id);
        if (request) {
            request.receiveUpdate(particle);
        } else {
            request = RequestFlow.createExternal(particle);
            request.handler.combineWith(this.callServiceHandler);
        }
        this.requests.set(request.id, request);

        await this.processRequest(request);
    }

    private processRequest(request: RequestFlow) {
        try {
            this.currentRequestId = request.id;
            request.execute(this.interpreter, this.connection, this.relayPeerId);
        } catch (err) {
            log.error('particle processing failed: ' + err);
        } finally {
            this.currentRequestId = null;
        }
    }

    private interpreterCallback: ParticleHandler = (
        serviceId: string,
        fnName: string,
        args: any[],
        tetraplets: SecurityTetraplet[][],
    ): CallServiceResult => {
        if (this.currentRequestId === null) {
            throw Error('current request can`t be null here');
        }

        const request = this.requests.get(this.currentRequestId);
        const particle = request.getParticle();
        if (particle === null) {
            throw new Error("particle can't be null here");
        }
        const res = request.handler.execute({
            serviceId,
            fnName,
            args,
            tetraplets,
            particleContext: {
                particleId: request.id,
                initPeerId: particle.init_peer_id,
                timeStamp: particle.timestamp,
                ttl: particle.ttl,
                signature: particle.signature,
            },
        });

        if (res.result === undefined) {
            log.error(
                `Call to serviceId=${serviceId} fnName=${fnName} unexpectedly returned undefined result, falling back to null`,
            );
            res.result = null;
        }

        return {
            ret_code: res.retCode,
            result: JSON.stringify(res.result),
        };
    };

    private initWatchDog() {
        this.watchDog = setInterval(() => {
            for (let key in this.requests.keys) {
                if (this.requests.get(key).hasExpired()) {
                    this.requests.delete(key);
                }
            }
        }, 5000);
    }

    private clearWathcDog() {
        clearInterval(this.watchDog);
    }
}
