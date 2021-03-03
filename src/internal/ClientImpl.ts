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
import { PeerIdB58, SecurityTetraplet } from './commonTypes';
import { FluenceClient } from 'src';
import { RequestFlow } from './RequestFlow';
import { AquaCallHandler, errorHandler, fnHandler } from './AquaHandler';
import { loadRelayFn, loadVariablesService } from './RequestFlowBuilder';

const makeDefaultClientHandler = (): AquaCallHandler => {
    const res = new AquaCallHandler();
    res.use(errorHandler);
    res.use(fnHandler('op', 'identity', (args, _) => args));
    return res;
};

export class ClientImpl implements FluenceClient {
    readonly selfPeerIdFull: PeerId;

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
    protected processor: ParticleProcessor;

    constructor(selfPeerIdFull: PeerId) {
        this.selfPeerIdFull = selfPeerIdFull;
        this.aquaCallHandler = makeDefaultClientHandler();
        this.processor = new ParticleProcessor(selfPeerIdFull, this.aquaCallHandler);
    }

    aquaCallHandler: AquaCallHandler;

    async disconnect(): Promise<void> {
        if (this.connection) {
            await this.connection.disconnect();
        }
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
            this.processor.executeIncomingParticle.bind(this.processor),
        );
        await connection.connect();
        this.connection = connection;
        await this.processor.init(connection);
    }

    async initiateFlow(request: RequestFlow): Promise<void> {
        // setting `relayVariableName` here. If the client is not connected (i.e it is created as local) then there is no relay
        request.handler.on(loadVariablesService, loadRelayFn, () => {
            return this.relayPeerId || '';
        });
        await request.initState(this.selfPeerIdFull);
        this.processor.executeLocalParticle(request);
    }
}
