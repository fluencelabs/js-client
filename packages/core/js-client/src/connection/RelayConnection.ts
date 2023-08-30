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
import { PeerIdB58 } from '@fluencelabs/interfaces';
import { pipe } from 'it-pipe';
import { encode, decode } from 'it-length-prefixed';
import type { PeerId } from '@libp2p/interface/peer-id';
import { createLibp2p, Libp2p } from 'libp2p';

import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { webSockets } from '@libp2p/websockets';
import { all } from '@libp2p/websockets/filters';
import { multiaddr } from '@multiformats/multiaddr';
import type { Multiaddr } from '@multiformats/multiaddr';

import map from 'it-map';
import { fromString } from 'uint8arrays/from-string';
import { toString } from 'uint8arrays/to-string';

import { logger } from '../util/logger.js';
import { Subject } from 'rxjs';
import { throwIfHasNoPeerId } from '../util/libp2pUtils.js';
import { IConnection } from './interfaces.js';
import { IParticle } from '../particle/interfaces.js';
import { Particle, serializeToString } from '../particle/Particle.js';
import { IStartable } from '../util/commonTypes.js';

const log = logger('connection');

export const PROTOCOL_NAME = '/fluence/particle/2.0.0';

/**
 * Options to configure fluence relay connection
 */
export interface RelayConnectionConfig {
    /**
     * Peer id of the Fluence Peer
     */
    peerId: PeerId;

    /**
     * Multiaddress of the relay to make connection to
     */
    relayAddress: Multiaddr;

    /**
     * The dialing timeout in milliseconds
     */
    dialTimeoutMs?: number;

    /**
     * The maximum number of inbound streams for the libp2p node.
     * Default: 1024
     */
    maxInboundStreams: number;

    /**
     * The maximum number of outbound streams for the libp2p node.
     * Default: 1024
     */
    maxOutboundStreams: number;
}

/**
 * Implementation for JS peers which connects to Fluence through relay node
 */
export class RelayConnection implements IStartable, IConnection {
    private relayAddress: Multiaddr;
    private lib2p2Peer: Libp2p | null = null;

    constructor(private config: RelayConnectionConfig) {
        this.relayAddress = multiaddr(this.config.relayAddress);
        throwIfHasNoPeerId(this.relayAddress);
    }

    getRelayPeerId(): string {
        // since we check for peer id in constructor, we can safely use ! here
        return this.relayAddress.getPeerId()!;
    }

    supportsRelay(): boolean {
        return true;
    }

    particleSource = new Subject<IParticle>();

    async start(): Promise<void> {
        // check if already started
        if (this.lib2p2Peer !== null) {
            return;
        }

        const lib2p2Peer = await createLibp2p({
            peerId: this.config.peerId,
            transports: [
                webSockets({
                    filter: all,
                }),
            ],
            streamMuxers: [mplex()],
            connectionEncryption: [noise()],
            connectionManager: {
                dialTimeout: this.config.dialTimeoutMs,
            },
            connectionGater: {
                // By default, this function forbids connections to private peers. For example multiaddr with ip 127.0.0.1 isn't allowed
                denyDialMultiaddr: () => Promise.resolve(false)
            }
        });

        this.lib2p2Peer = lib2p2Peer;
        this.lib2p2Peer.start();
        await this.connect();
    }

    async stop(): Promise<void> {
        // check if already stopped
        if (this.lib2p2Peer === null) {
            return;
        }

        await this.lib2p2Peer.unhandle(PROTOCOL_NAME);
        await this.lib2p2Peer.stop();
    }

    async sendParticle(nextPeerIds: PeerIdB58[], particle: IParticle): Promise<void> {
        if (this.lib2p2Peer === null) {
            throw new Error('Relay connection is not started');
        }

        if (nextPeerIds.length !== 1 && nextPeerIds[0] !== this.getRelayPeerId()) {
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

        const stream = await this.lib2p2Peer.dialProtocol(this.relayAddress, PROTOCOL_NAME);
        const sink = stream.sink;

        return pipe(
            [fromString(serializeToString(particle))],
            // @ts-ignore
            encode(),
            sink,
        );
    }

    private async connect() {
        if (this.lib2p2Peer === null) {
            throw new Error('Relay connection is not started');
        }

        this.lib2p2Peer.handle(
            [PROTOCOL_NAME],
            async ({ connection, stream }) => {
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
                                    const particle = Particle.fromString(msg);
                                    this.particleSource.next(particle);
                                } catch (e) {
                                    log.error('error on handling a new incoming message: %j', e);
                                }
                            }
                        } catch (e) {
                            log.error('connection closed: %j', e);
                        }
                    },
                );
            },
            {
                maxInboundStreams: this.config.maxInboundStreams,
                maxOutboundStreams: this.config.maxOutboundStreams,
            },
        );

        log.debug("dialing to the node with client's address: %s", this.lib2p2Peer.peerId.toString());

        try {
            await this.lib2p2Peer.dial(this.relayAddress);
        } catch (e: any) {
            if (e.name === 'AggregateError' && e._errors?.length === 1) {
                const error = e._errors[0];
                throw new Error(`Error dialing node ${this.relayAddress}:\n${error.code}\n${error.message}`);
            } else {
                throw e;
            }
        }
    }
}
