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

import Websockets from 'libp2p-websockets';
import Mplex from 'libp2p-mplex';
import Lib2p2Peer from 'libp2p';
import { decode, encode } from 'it-length-prefixed';
import pipe from 'it-pipe';
import * as log from 'loglevel';
import { logParticle, parseParticle, Particle, ParticleOld, toPayload } from './particle';
import { NOISE } from '@chainsafe/libp2p-noise';
import PeerId from 'peer-id';
import { Multiaddr } from 'multiaddr';
import { all as allow_all } from 'libp2p-websockets/src/filters';
import { Connection } from 'libp2p-interfaces/src/topology';
import { Subject } from 'rxjs';

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
    relayAddress: Multiaddr;

    /**
     * @property {number} [dialTimeout] - How long a dial attempt is allowed to take.
     */
    dialTimeout?: number;
}

export class FluenceConnection {
    private _address;

    constructor() {}

    static async createConnection(
        options: FluenceConnectionOptions,
        incomingParticles: Subject<Particle>,
        outgoingParticles: Subject<Particle>,
    ): Promise<FluenceConnection> {
        const res = new FluenceConnection();

        const transportKey = Websockets.prototype[Symbol.toStringTag];
        res._lib2p2Peer = await Lib2p2Peer.create({
            peerId: options.peerId,
            modules: {
                transport: [Websockets],
                streamMuxer: [Mplex],
                connEncryption: [NOISE],
            },
            config: {
                transport: {
                    [transportKey]: {
                        filter: allow_all,
                    },
                },
            },
            dialer: {
                dialTimeout: options?.dialTimeout,
            },
        });

        outgoingParticles.subscribe((p) => {
            res._sendParticle(p);
        });

        await res._start(options.relayAddress, incomingParticles);

        return res;
    }

    async disconnect() {
        await this._lib2p2Peer.stop();
    }

    private async _sendParticle(particle: Particle): Promise<void> {
        particle.logTo('debug', 'sending particle:');

        /*
        if (this._connection.streams.length !== 1) {
            throw 'Incorrect number of streams in FluenceConnection';
        }

        const sink = this._connection.streams[0].sink;
        */

        const conn = await this._lib2p2Peer.dialProtocol(this._address, PROTOCOL_NAME);
        const sink = conn.stream.sink;

        pipe(
            // force new line
            [Buffer.from(particle.toString(), 'utf8')],
            encode(),
            sink,
        );
    }

    private _lib2p2Peer: Lib2p2Peer;
    private _connection: Connection;

    private async _start(address: Multiaddr, incomingParticles: Subject<Particle>) {
        await this._lib2p2Peer.start();
        this._address = address;

        log.debug(`dialing to the node with client's address: ` + this._lib2p2Peer.peerId.toB58String());

        try {
            this._connection = await this._lib2p2Peer.dial(address);
        } catch (e1) {
            const e = e1 as any;
            if (e.name === 'AggregateError' && e._errors.length === 1) {
                const error = e._errors[0];
                throw `Error dialing node ${address}:\n${error.code}\n${error.message}`;
            } else {
                throw e;
            }
        }

        this._lib2p2Peer.handle([PROTOCOL_NAME], async ({ connection, stream }) => {
            pipe(stream.source, decode(), async (source: AsyncIterable<string>) => {
                for await (const msg of source) {
                    try {
                        const particle = Particle.fromString(msg);
                        logParticle(log.debug, 'Particle is received:', particle);
                        incomingParticles.next(particle);
                    } catch (e) {
                        log.error('error on handling a new incoming message: ' + e);
                    }
                }
            });
        });
    }
}
