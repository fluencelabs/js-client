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
import { pipe } from 'it-pipe';
import * as log from 'loglevel';
import { Particle } from './Particle';
import { NOISE } from '@chainsafe/libp2p-noise';
import { Multiaddr } from 'multiaddr';
import { all as allow_all } from 'libp2p-websockets/src/filters';
import { Connection } from 'libp2p-interfaces/src/topology';
import Buffer from './Buffer';

export const PROTOCOL_NAME = '/fluence/particle/2.0.0';

/**
 * Options to configure fluence connection
 */
export interface FluenceConnectionOptions {
    /**
     * Peer id of the Fluence Peer
     */
    peerId: any;

    /**
     * Multiaddress of the relay to make connection to
     */
    relayAddress: Multiaddr;

    /**
     * The dialing timeout in milliseconds
     */
    dialTimeoutMs?: number;

    /**
     * Handler for incoming particles from the connection
     */
    onIncomingParticle: (p: Particle) => void;
}

export class FluenceConnection {
    constructor() {}

    static async createConnection(options: FluenceConnectionOptions): Promise<FluenceConnection> {
        const res = new FluenceConnection();

        const transportKey = Websockets.prototype[Symbol.toStringTag];
        res._lib2p2Peer = await Lib2p2Peer.create({
            peerId: options.peerId,
            modules: {
                transport: [Websockets],
                streamMuxer: [Mplex],
                connEncryption: [NOISE as any],
            },
            config: {
                transport: {
                    [transportKey]: {
                        filter: allow_all,
                    },
                },
            },
            dialer: {
                dialTimeout: options?.dialTimeoutMs,
            },
            connectionManager: {},
        });

        console.log(res._lib2p2Peer.connectionManager.eventNames());

        res._lib2p2Peer.handle([PROTOCOL_NAME], async ({ connection, stream }) => {
            pipe(
                // force new line
                stream.source,
                // @ts-ignore
                decode(),
                async (source: AsyncIterable<string>) => {
                    try {
                        for await (const msg of source) {
                            try {
                                const particle = Particle.fromString(msg);
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

        res._relayAddress = options.relayAddress;

        res._lib2p2Peer.handle('error', (err) => {
            console.log('libp2p error: ', err);
        });

        res._lib2p2Peer.handle('peer:discovery', (peer) => {
            console.log('libp2p peer:discovery: ', peer);
        });

        res._lib2p2Peer.connectionManager.on('peer:connect', (connection) => {
            console.log('libp2p peer:connect: ', connection);
        });

        res._lib2p2Peer.connectionManager.on('peer:disconnect', (connection) => {
            console.log('libp2p peer:disconnect: ', connection);
        });

        res._lib2p2Peer.peerStore.on('peer', (peerId) => {
            console.log('libp2p peerStore peer: ', peerId);
        });

        res._lib2p2Peer.peerStore.on('change:multiaddrs', (x) => {
            console.log('libp2p change:multiaddrs: ', x);
        });

        res._lib2p2Peer.peerStore.on('change:protocols', (x) => {
            console.log('libp2p change:protocols: ', x);
        });

        res._lib2p2Peer.addressManager.on('change:addresses', () => {
            console.log('libp2p change:addresses');
        });

        return res;
    }

    async disconnect() {
        await this._lib2p2Peer.stop();
    }

    public async sendParticle(particle: Particle): Promise<void> {
        // particle.logTo('debug', 'sending particle:');

        // console.log(this._connection);

        // TODO:: find out why this doesn't work and a new connection has to be established each time
        //if (this._connection.streams.length !== 1) {
        //    throw 'Incorrect number of streams in FluenceConnection';
        //}

        // const sink = this._connection.streams[0].sink;

        // const conn = await this._connection.newStream(PROTOCOL_NAME);

        // const sink = conn.stream.sink;

        /*
        const conn = await this._lib2p2Peer.dialProtocol(this._relayAddress, PROTOCOL_NAME);
        const sink = conn.stream.sink;
        */

        // const buf = encode(Buffer.from(particle.toString(), 'utf8'));

        // await this._outStream.sink(buf);

        const { stream } = await this._connection.newStream(PROTOCOL_NAME);
        const sink = stream.sink;

        pipe(
            // force new line
            [Buffer.from(particle.toString(), 'utf8')],
            encode(),
            // @ts-ignore
            sink,
        );

        stream.close();
        this._connection.removeStream(stream.id);
        console.log('streams count: ', this._connection.streams.length);
    }

    public async connect() {
        await this._lib2p2Peer.start();

        log.debug(`dialing to the node with client's address: ` + this._lib2p2Peer.peerId.toB58String());

        try {
            this._connection = await this._lib2p2Peer.dial(this._relayAddress);
            // const { stream } = await this._lib2p2Peer.dialProtocol(this._relayAddress, PROTOCOL_NAME);
            // console.log(stream.id);
            // this._outStream = stream;
            //
            // this._outStream.
        } catch (e1) {
            const e = e1 as any;
            if (e.name === 'AggregateError' && e._errors.length === 1) {
                const error = e._errors[0];
                throw `Error dialing node ${this._relayAddress}:\n${error.code}\n${error.message}`;
            } else {
                throw e;
            }
        }
    }

    // private _outStream: MuxedStream;
    private _lib2p2Peer: Lib2p2Peer;
    private _connection: Connection;
    private _relayAddress: Multiaddr;
}
