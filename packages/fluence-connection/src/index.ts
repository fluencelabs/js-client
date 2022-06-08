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

import { WebSockets } from '@libp2p/websockets';
import { Mplex } from '@libp2p/mplex';
import { Libp2p as Lib2p2Peer, createLibp2p } from 'libp2p';
import { decode, encode } from 'it-length-prefixed';
import { pipe } from 'it-pipe';
import { Noise } from '@chainsafe/libp2p-noise';
import type { MultiaddrInput } from '@multiformats/multiaddr';
import { Multiaddr } from '@multiformats/multiaddr';
import { PeerId } from '@libp2p/interfaces/peer-id';
import { Connection } from '@libp2p/interfaces/connection';
import * as log from 'loglevel';

export const PROTOCOL_NAME = '/fluence/particle/2.0.0';

/**
 * Options to configure fluence connection
 */
export interface FluenceConnectionOptions {
    /**
     * Peer id of the Fluence Peer
     */
    peerId: PeerId;

    /**
     * Multiaddress of the relay to make connection to
     */
    relayAddress: MultiaddrInput;

    /**
     * The dialing timeout in milliseconds
     */
    dialTimeoutMs?: number;

    /**
     * Handler for incoming particles from the connection
     */
    onIncomingParticle: (particle: string) => void;
}

export class FluenceConnection {
    constructor(private _lib2p2Peer: Lib2p2Peer, private _relayAddress: Multiaddr) {}

    static async createConnection(options: FluenceConnectionOptions): Promise<FluenceConnection> {
        const lib2p2Peer = await createLibp2p({
            peerId: options.peerId,
            // @ts-ignore
            transports: [new WebSockets()],
            // @ts-ignore
            streamMuxers: [new Mplex()],
            connectionEncryption: [new Noise()],
            connectionManager: {
                dialTimeout: options?.dialTimeoutMs,
            },
        });

        lib2p2Peer.handle([PROTOCOL_NAME], async ({ connection, stream }) => {
            pipe(
                // force new line
                // @ts-ignore
                stream.source,
                decode(),
                async (source: AsyncIterable<string>) => {
                    try {
                        for await (const particle of source) {
                            try {
                                options.onIncomingParticle(particle);
                            } catch (e) {
                                log.error('error on handling a new incoming message: ' + e);
                            }
                        }
                    } catch (e) {
                        log.debug('connection closed: ' + e);
                    }
                },
            );
        });

        const relayAddress = options.relayAddress;

        return new FluenceConnection(lib2p2Peer, new Multiaddr(relayAddress));
    }

    getPeerId(): string {
        return this._relayAddress.getPeerId()!;
    }

    async disconnect() {
        await this._lib2p2Peer.stop();
    }

    async sendParticle(particle: string): Promise<void> {
        /*
        TODO:: find out why this doesn't work and a new connection has to be established each time
        if (this._connection.streams.length !== 1) {
            throw new Error('Incorrect number of streams in FluenceConnection');
        }

        const sink = this._connection.streams[0].sink;
        */

        const conn = await this._lib2p2Peer.dialProtocol(new Multiaddr(this._relayAddress), PROTOCOL_NAME);
        // @ts-ignore
        const sink = conn.stream.sink;

        pipe(
            // force new line
            [Buffer.from(particle, 'utf8')],
            encode(),
            sink,
        );
    }

    async connect() {
        await this._lib2p2Peer.start();

        log.debug(`dialing to the node with client's address: ` + this._lib2p2Peer.peerId);

        try {
            this._connection = await this._lib2p2Peer.dial(this._relayAddress);
        } catch (e: any) {
            if (e.name === 'AggregateError' && e._errors?.length === 1) {
                const error = e._errors[0];
                throw new Error(`Error dialing node ${this._relayAddress}:\n${error.code}\n${error.message}`);
            } else {
                throw e;
            }
        }
    }

    private _connection: Connection | undefined;
}
