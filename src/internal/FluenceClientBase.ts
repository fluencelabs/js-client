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

export abstract class FluenceClientBase {
    readonly selfPeerId: PeerId;
    get relayPeerID(): PeerId {
        return this.connection?.nodePeerId;
    }
    get isConnected(): boolean {
        return this.connection?.isConnected();
    }

    protected connection: FluenceConnection;
    protected processor: ParticleProcessor;
    protected abstract strategy: ParticleProcessorStrategy;

    constructor(selfPeerId: PeerId) {
        this.selfPeerId = selfPeerId;
    }

    async disconnect(): Promise<void> {
        await this.connection.disconnect();
        await this.processor.destroy();
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
            this.selfPeerId,
            this.processor.executeExternalParticle.bind(this.processor),
        );
        await connection.connect();
        await this.processor.init();

        this.connection = connection;
    }

    async sendScript(script: string, data: Map<string, any>, ttl?: number): Promise<string> {
        const particle = await build(this.selfPeerId, script, data, ttl);
        this.processor.executeLocalParticle(particle);
        return particle.id;
    }
}
