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
import { FluenceConnection } from './FluenceConnection';

import { CallServiceResult, ParticleHandler, PeerIdB58, SecurityTetraplet } from './commonTypes';
import { FluenceClient } from 'src';
import { RequestFlow } from './RequestFlow';
import { AquaCallHandler, errorHandler, fnHandler } from './AquaHandler';
import { loadRelayFn, loadVariablesService } from './RequestFlowBuilder';
import { logParticle, Particle } from './particle';
import log from 'loglevel';
import { AquamarineInterpreter } from './aqua/interpreter';

const makeDefaultClientHandler = (): AquaCallHandler => {
    const res = new AquaCallHandler();
    res.use(errorHandler);
    res.use(fnHandler('op', 'identity', (args, _) => args));
    return res;
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
    private interpreter: AquamarineInterpreter;

    constructor(selfPeerIdFull: PeerId) {
        this.selfPeerIdFull = selfPeerIdFull;
        this.aquaCallHandler = makeDefaultClientHandler();
    }

    aquaCallHandler: AquaCallHandler;

    async disconnect(): Promise<void> {
        if (this.connection) {
            await this.connection.disconnect();
        }
        this.clearWathcDog();
    }

    async initAquamarineRuntime(): Promise<void> {
        this.interpreter = await AquamarineInterpreter.create({
            particleHandler: this.interpreterCallback.bind(this),
            peerId: this.selfPeerIdFull,
        });
    }

    async connect(multiaddr: string | Multiaddr): Promise<void> {
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
        await connection.connect();
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
        request.handler.combineWith(this.aquaCallHandler);
        this.requests.set(request.id, request);

        await this.processRequest(request);
    }

    async executeIncomingParticle(particle: Particle) {
        logParticle(log.debug, 'external particle received', particle);

        let request = this.requests.get(particle.id);
        if (request) {
            request.receiveUpdate(particle);
        } else {
            request = RequestFlow.createExternal(particle);
            request.handler.combineWith(this.aquaCallHandler);
        }
        this.requests.set(request.id, request);

        await this.processRequest(request);
    }

    private async processRequest(request: RequestFlow): Promise<void> {
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
        const res = request.handler.execute({
            serviceId,
            fnName,
            args,
            tetraplets,
            particleContext: {
                particleId: request.id,
            },
        });
        return {
            ret_code: res.retCode,
            result: JSON.stringify(res.result || {}),
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
