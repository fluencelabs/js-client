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

import { ParticleProcessor } from './ParticleProcessor';
import { ParticleProcessorStrategy } from './ParticleProcessorStrategy';
import { ErrorCodes, InterpreterOutcome, PeerIdB58, SecurityTetraplet } from './commonTypes';
import { Particle } from './particle';
import log from 'loglevel';
import { FluenceClient } from 'src';
import { RequestFlow } from './RequestFlow';
import { AquaCallHandler, errorHandler, fnHandler } from './AquaHandler';

const makeDefaultClientHandler = (): AquaCallHandler => {
    const res = new AquaCallHandler();
    res.use(errorHandler);
    res.use(fnHandler('op', 'identity', (args, _) => args));
    return res;
};

export class FluenceClientTmp implements FluenceClient {
    readonly selfPeerIdFull: PeerId;

    get relayPeerId(): PeerIdB58 {
        return this.connection?.nodePeerId.toB58String();
    }

    get selfPeerId(): PeerIdB58 {
        return this.selfPeerIdFull.toB58String();
    }

    get isConnected(): boolean {
        return this.connection?.isConnected();
    }

    protected connection: FluenceConnection;
    protected processor: ParticleProcessor;

    constructor(selfPeerIdFull: PeerId) {
        this.selfPeerIdFull = selfPeerIdFull;
        this.processor = new ParticleProcessor(this.strategy, selfPeerIdFull);
    }

    handler: AquaCallHandler = makeDefaultClientHandler();

    async disconnect(): Promise<void> {
        await this.connection.disconnect();
        await this.processor.destroy();
    }

    // HACK:: this is only needed to fix tests.
    // Particle processor should be tested instead
    async local(): Promise<void> {
        await this.processor.init();
    }

    /**
     * Establish a connection to the node. If the connection is already established, disconnect and reregister all services in a new connection.
     *
     * @param multiaddr
     */
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
            this.processor.executeExternalParticle.bind(this.processor),
        );
        await connection.connect();
        await this.processor.init();

        this.connection = connection;
    }

    async initiateFlow(particle: RequestFlow): Promise<string> {
        const dto = await particle.getParticle(this.selfPeerIdFull);
        this.processor.executeLocalParticle(dto);
        return dto.id;
    }

    registerCallback(
        serviceId: string,
        fnName: string,
        callback: (args: any[], tetraplets: SecurityTetraplet[][]) => object,
    ) {
        this.handler.on(serviceId, fnName, callback);
    }

    unregisterCallback(serviceId: string, fnName: string) {
        // TODO:: don't know how to make unregistration yet;
    }

    protected strategy: ParticleProcessorStrategy = {
        particleHandler: (serviceId: string, fnName: string, args: any[], tetraplets: SecurityTetraplet[][]) => {
            return this.handler.execute({
                serviceId,
                fnName,
                args,
                tetraplets,
                particleContext: {},
            });
        },

        sendParticleFurther: async (particle: Particle) => {
            try {
                await this.connection.sendParticle(particle);
            } catch (reason) {
                log.error(`Error on sending particle with id ${particle.id}: ${reason}`);
            }
        },

        onParticleTimeout: (particle: Particle, now: number) => {
            log.info(`Particle expired. Now: ${now}, ttl: ${particle.ttl}, ts: ${particle.timestamp}`);
        },
        onLocalParticleRecieved: (particle: Particle) => {
            log.debug('local particle received', particle);
        },
        onExternalParticleRecieved: (particle: Particle) => {
            log.debug('external particle received', particle);
        },
        onInterpreterExecuting: (particle: Particle) => {
            log.debug('interpreter executing particle', particle);
        },
        onInterpreterExecuted: (interpreterOutcome: InterpreterOutcome) => {
            log.debug('inner interpreter outcome:', interpreterOutcome);
        },
    };
}
