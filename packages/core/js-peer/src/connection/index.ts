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
import { PeerIdB58 } from '@fluencelabs/interface';
import { FluenceConnection, ParticleHandler } from '../interfaces/index.js';
import { pipe } from 'it-pipe';
import { encode, decode } from 'it-length-prefixed';
import type { PeerId } from '@libp2p/interface-peer-id';
import { createLibp2p, Libp2p } from 'libp2p';

import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { webSockets } from '@libp2p/websockets';
import { all } from '@libp2p/websockets/filters';
import { multiaddr } from '@multiformats/multiaddr';
import type { MultiaddrInput, Multiaddr } from '@multiformats/multiaddr';
import type { Connection } from '@libp2p/interface-connection';

import map from 'it-map';
import { fromString } from 'uint8arrays/from-string';
import { toString } from 'uint8arrays/to-string';

import log from 'loglevel';

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
}

/**
 * Implementation for JS peers which connects to Fluence through relay node
 */
export class RelayConnection extends FluenceConnection {
    constructor(
        public peerId: PeerIdB58,
        private _lib2p2Peer: Libp2p,
        private _relayAddress: Multiaddr,
        public readonly relayPeerId: PeerIdB58,
    ) {
        super();
    }

    private _connection?: Connection;

    static async createConnection(options: FluenceConnectionOptions): Promise<RelayConnection> {
        const lib2p2Peer = await createLibp2p({
            peerId: options.peerId,
            transports: [
                webSockets({
                    filter: all,
                }),
            ],
            streamMuxers: [mplex()],
            connectionEncryption: [noise()],
        });

        const relayMultiaddr = multiaddr(options.relayAddress);
        const relayPeerId = relayMultiaddr.getPeerId();
        if (relayPeerId === null) {
            throw new Error('Specified multiaddr is invalid or missing peer id: ' + options.relayAddress);
        }

        return new RelayConnection(
            // force new line
            options.peerId.toString(),
            lib2p2Peer,
            relayMultiaddr,
            relayPeerId,
        );
    }

    async disconnect() {
        await this._lib2p2Peer.unhandle(PROTOCOL_NAME);
        await this._lib2p2Peer.stop();
    }

    async sendParticle(nextPeerIds: PeerIdB58[], particle: string): Promise<void> {
        if (nextPeerIds.length !== 1 && nextPeerIds[0] !== this.relayPeerId) {
            throw new Error(
                `Relay connection only accepts peer id of the connected relay. Got: ${JSON.stringify(
                    nextPeerIds,
                )} instead.`,
            );
        }

        /*
        TODO:: find out why this doesn't work and a new connection has to be established each time
        if (this._connection.streams.length !== 1) {
            throw new Error('Incorrect number of streams in FluenceConnection');
        }

        const sink = this._connection.streams[0].sink;
        */

        const stream = await this._lib2p2Peer.dialProtocol(this._relayAddress, PROTOCOL_NAME);
        const sink = stream.sink;

        pipe(
            [fromString(particle)],
            // @ts-ignore
            encode(),
            sink,
        );
    }

    async connect(onIncomingParticle: ParticleHandler) {
        await this._lib2p2Peer.start();

        this._lib2p2Peer.handle([PROTOCOL_NAME], async ({ connection, stream }) => {
            pipe(
                stream.source,
                // @ts-ignore
                decode(),
                // @ts-ignore
                (source) => map(source, (buf) => toString(buf.subarray())),
                async (source) => {
                    try {
                        for await (const msg of source) {
                            try {
                                onIncomingParticle(msg);
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

        log.debug(`dialing to the node with client's address: ` + this._lib2p2Peer.peerId.toString());

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
}
