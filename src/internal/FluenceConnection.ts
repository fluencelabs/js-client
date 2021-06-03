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
import Peer from 'libp2p';
import { decode, encode } from 'it-length-prefixed';
import pipe from 'it-pipe';
import * as log from 'loglevel';
import { parseParticle, Particle, toPayload } from './particle';
import { NOISE } from 'libp2p-noise';
import PeerId from 'peer-id';
import Multiaddr from 'multiaddr';
import { all as allow_all } from 'libp2p-websockets/src/filters';

export const PROTOCOL_NAME = '/fluence/faas/1.0.0';

enum Status {
    Initializing = 'Initializing',
    Connected = 'Connected',
    Disconnected = 'Disconnected',
}

/**
 * Options to configure fluence connection
 */
export interface FluenceConnectionOptions {
    /**
     * @property {number} [checkConnectionTTL] - TTL for the check connection request in ms
     */
    checkConnectionTTL?: number;

    /**
     * @property {number} [checkConnectionTTL] - set to true to skip check connection request completely
     */
    skipCheckConnection?: boolean;

    /**
     * @property {number} [dialTimeout] - How long a dial attempt is allowed to take.
     */
    dialTimeout?: number;
}

export class VersionIncompatibleError extends Error {
    __proto__: Error;
    constructor() {
        const trueProto = new.target.prototype;
        super('Current version of JS SDK is incompatible with the connected Fluence node. Please update JS SDK');
        this.__proto__ = trueProto;
    }
}

export class FluenceConnection {
    private readonly selfPeerId: PeerId;
    private node: Peer;
    private readonly address: Multiaddr;
    readonly nodePeerId: PeerId;
    private readonly selfPeerIdStr: string;
    private readonly handleParticle: (call: Particle) => void;

    constructor(
        multiaddr: Multiaddr,
        hostPeerId: PeerId,
        selfPeerId: PeerId,
        handleParticle: (call: Particle) => void,
    ) {
        this.selfPeerId = selfPeerId;
        this.handleParticle = handleParticle;
        this.selfPeerIdStr = selfPeerId.toB58String();
        this.address = multiaddr;
        this.nodePeerId = hostPeerId;
    }

    async connect(options?: FluenceConnectionOptions) {
        await this.createPeer(options);
        await this.startReceiving();
    }

    isConnected() {
        return this.status === Status.Connected;
    }

    // connection status. If `Disconnected`, it cannot be reconnected
    private status: Status = Status.Initializing;

    private async createPeer(options?: FluenceConnectionOptions) {
        const peerInfo = this.selfPeerId;
        const transportKey = Websockets.prototype[Symbol.toStringTag];
        this.node = await Peer.create({
            peerId: peerInfo,
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
                timeout: options?.dialTimeout,
            },
        });
    }

    private async startReceiving() {
        if (this.status === Status.Initializing) {
            await this.node.start();

            log.trace(`dialing to the node with client's address: ` + this.node.peerId.toB58String());

            try {
                await this.node.dial(this.address);
            } catch (e) {
                if (e.name === 'AggregateError' && e._errors[0].length === 1) {
                    const error = e._errors[0];
                    throw `Error dialing node ${this.address}: ${error.code} ${error.message}`;
                } else {
                    throw e;
                }
            }

            let _this = this;

            this.node.handle([PROTOCOL_NAME], async ({ connection, stream }) => {
                pipe(stream.source, decode(), async function (source: AsyncIterable<string>) {
                    for await (const msg of source) {
                        try {
                            let particle = parseParticle(msg);
                            log.trace('Particle is received:', JSON.stringify(particle, undefined, 2));
                            _this.handleParticle(particle);
                        } catch (e) {
                            log.error('error on handling a new incoming message: ' + e);
                        }
                    }
                });
            });

            this.status = Status.Connected;
        } else {
            throw Error(`can't start receiving. Status: ${this.status}`);
        }
    }

    private checkConnectedOrThrow() {
        if (this.status !== Status.Connected) {
            throw Error(`connection is in ${this.status} state`);
        }
    }

    async disconnect() {
        await this.node.stop();
        this.status = Status.Disconnected;
    }

    async sendParticle(particle: Particle): Promise<void> {
        this.checkConnectedOrThrow();

        let action = toPayload(particle);
        let particleStr = JSON.stringify(action);
        log.debug('send particle: \n' + JSON.stringify(action, undefined, 2));

        // create outgoing substream
        const conn = (await this.node.dialProtocol(this.address, PROTOCOL_NAME)) as {
            stream;
            protocol: string;
        };

        pipe(
            [Buffer.from(particleStr, 'utf8')],
            // at first, make a message varint
            encode(),
            conn.stream.sink,
        );
    }
}
