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

import { build } from './particle';
import * as PeerId from 'peer-id';
import Multiaddr from 'multiaddr';
import { FluenceConnection } from './FluenceConnection';

import { ParticleProcessor } from './ParticleProcessor';
import { ParticleProcessorStrategy } from './ParticleProcessorStrategy';
import { PeerIdB58 } from './commonTypes';

export abstract class FluenceClientBase {
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
    protected abstract strategy: ParticleProcessorStrategy;

    constructor(selfPeerIdFull: PeerId) {
        this.selfPeerIdFull = selfPeerIdFull;
    }

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

    async sendScript(script: string, data?: Map<string, any>, ttl?: number): Promise<string> {
        const particle = await build(this.selfPeerIdFull, script, data, ttl);
        await this.processor.executeLocalParticle(particle);
        return particle.id;
    }
}
