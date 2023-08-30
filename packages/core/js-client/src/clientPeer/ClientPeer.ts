/*
 * Copyright 2023 Fluence Labs Limited
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
import { ClientConfig, ConnectionState, IFluenceClient, PeerIdB58, RelayOptions } from '@fluencelabs/interfaces';
import { RelayConnection, RelayConnectionConfig } from '../connection/RelayConnection.js';
import { fromOpts, KeyPair } from '../keypair/index.js';
import { FluencePeer, PeerConfig } from '../jsPeer/FluencePeer.js';
import { relayOptionToMultiaddr } from '../util/libp2pUtils.js';
import { IAvmRunner, IMarineHost } from '../marine/interfaces.js';
import { JsServiceHost } from '../jsServiceHost/JsServiceHost.js';
import { logger } from '../util/logger.js';

const log = logger('client');

const DEFAULT_TTL_MS = 7000;
const MAX_OUTBOUND_STREAMS = 1024;
const MAX_INBOUND_STREAMS = 1024;

export const makeClientPeerConfig = async (
    relay: RelayOptions,
    config: ClientConfig,
): Promise<{ peerConfig: PeerConfig; relayConfig: RelayConnectionConfig; keyPair: KeyPair }> => {
    const opts = config?.keyPair || { type: 'Ed25519', source: 'random' };
    const keyPair = await fromOpts(opts);
    const relayAddress = relayOptionToMultiaddr(relay);

    return {
        peerConfig: {
            debug: {
                printParticleId: config?.debug?.printParticleId || false,
            },
            defaultTtlMs: config?.defaultTtlMs || DEFAULT_TTL_MS,
        },
        relayConfig: {
            peerId: keyPair.getLibp2pPeerId(),
            relayAddress: relayAddress,
            dialTimeoutMs: config?.connectionOptions?.dialTimeoutMs,
            maxInboundStreams: config?.connectionOptions?.maxInboundStreams || MAX_OUTBOUND_STREAMS,
            maxOutboundStreams: config?.connectionOptions?.maxOutboundStreams || MAX_INBOUND_STREAMS,
        },
        keyPair: keyPair,
    };
};

export class ClientPeer extends FluencePeer implements IFluenceClient {
    private relayPeerId: PeerIdB58;
    private relayConnection: RelayConnection;

    constructor(
        peerConfig: PeerConfig,
        relayConfig: RelayConnectionConfig,
        keyPair: KeyPair,
        marine: IMarineHost,
    ) {
        const relayConnection = new RelayConnection(relayConfig);

        super(peerConfig, keyPair, marine, new JsServiceHost(), relayConnection);
        this.relayPeerId = relayConnection.getRelayPeerId();
        this.relayConnection = relayConnection;
    }

    getPeerId(): string {
        return this.keyPair.getPeerId();
    }

    getPeerSecretKey(): Uint8Array {
        return this.keyPair.toEd25519PrivateKey();
    }

    connectionState: ConnectionState = 'disconnected';
    connectionStateChangeHandler: (state: ConnectionState) => void = () => {};

    getRelayPeerId(): string {
        return this.relayPeerId;
    }

    onConnectionStateChange(handler: (state: ConnectionState) => void): ConnectionState {
        this.connectionStateChangeHandler = handler;

        return this.connectionState;
    }

    private changeConnectionState(state: ConnectionState) {
        this.connectionState = state;
        this.connectionStateChangeHandler(state);
    }

    /**
     * Connect to the Fluence network
     */
    async connect(): Promise<void> {
        return this.start();
    }

    // /**
    //  * Disconnect from the Fluence network
    //  */
    async disconnect(): Promise<void> {
        return this.stop();
    }

    async start(): Promise<void> {
        log.trace('connecting to Fluence network');
        this.changeConnectionState('connecting');
        await super.start();
        await this.relayConnection.start();
        // TODO: check connection (`checkConnection` function) here
        this.changeConnectionState('connected');
        log.trace('connected');
    }

    async stop(): Promise<void> {
        log.trace('disconnecting from Fluence network');
        this.changeConnectionState('disconnecting');
        await super.stop();
        await this.relayConnection.stop();
        this.changeConnectionState('disconnected');
        log.trace('disconnected');
    }
}
