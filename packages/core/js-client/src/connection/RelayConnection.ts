/**
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

import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { PeerIdB58 } from "@fluencelabs/interfaces";
import { Stream } from "@libp2p/interface/connection";
import type { PeerId } from "@libp2p/interface/peer-id";
import { peerIdFromString } from "@libp2p/peer-id";
import { webSockets } from "@libp2p/websockets";
import { all } from "@libp2p/websockets/filters";
import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";
import { decode, encode } from "it-length-prefixed";
import map from "it-map";
import { pipe } from "it-pipe";
import { createLibp2p, Libp2p } from "libp2p";
import { identifyService } from "libp2p/identify";
import { pingService } from "libp2p/ping";
import { Subject } from "rxjs";
import { fromString } from "uint8arrays/from-string";
import { toString } from "uint8arrays/to-string";

import { IParticle } from "../particle/interfaces.js";
import {
    Particle,
    serializeToString,
    verifySignature,
} from "../particle/Particle.js";
import { throwIfHasNoPeerId } from "../util/libp2pUtils.js";
import { logger } from "../util/logger.js";

import { IConnection } from "./interfaces.js";

const log = logger("connection");

export const PROTOCOL_NAME = "/fluence/particle/2.0.0";

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
export class RelayConnection implements IConnection {
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

        this.lib2p2Peer = await createLibp2p({
            peerId: this.config.peerId,
            transports: [
                webSockets({
                    filter: all,
                }),
            ],
            streamMuxers: [yamux()],
            connectionEncryption: [noise()],
            connectionManager: {
                dialTimeout: this.config.dialTimeoutMs,
            },
            connectionGater: {
                // By default, this function forbids connections to private peers. For example multiaddr with ip 127.0.0.1 isn't allowed
                denyDialMultiaddr: () => {
                    return Promise.resolve(false);
                },
            },
            services: {
                identify: identifyService(),
                ping: pingService(),
            },
        });

        const supportedProtocols = (
            await this.lib2p2Peer.peerStore.get(this.lib2p2Peer.peerId)
        ).protocols;

        await this.lib2p2Peer.peerStore.patch(this.lib2p2Peer.peerId, {
            protocols: [...supportedProtocols, PROTOCOL_NAME],
        });

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

    async sendParticle(
        nextPeerIds: PeerIdB58[],
        particle: IParticle,
    ): Promise<void> {
        if (this.lib2p2Peer === null) {
            throw new Error("Relay connection is not started");
        }

        if (
            nextPeerIds.length !== 1 &&
            nextPeerIds[0] !== this.getRelayPeerId()
        ) {
            throw new Error(
                `Relay connection only accepts peer id of the connected relay. Got: ${JSON.stringify(
                    nextPeerIds,
                )} instead.`,
            );
        }

        log.trace("sending particle...");

        // Reusing active connection here
        const stream = await this.lib2p2Peer.dialProtocol(
            this.relayAddress,
            PROTOCOL_NAME,
        );

        log.trace("created stream with id ", stream.id);
        const sink = stream.sink;

        await pipe([fromString(serializeToString(particle))], encode(), sink);
        log.trace("data written to sink");
    }

    private async processIncomingMessage(msg: string, stream: Stream) {
        let particle: Particle | undefined;

        try {
            particle = Particle.fromString(msg);

            log.trace(
                "got particle from stream with id %s and particle id %s",
                stream.id,
                particle.id,
            );

            const initPeerId = peerIdFromString(particle.initPeerId);

            if (initPeerId.publicKey === undefined) {
                log.error(
                    "cannot retrieve public key from init_peer_id. particle id: %s. init_peer_id: %s",
                    particle.id,
                    particle.initPeerId,
                );

                return;
            }

            const isVerified = await verifySignature(
                particle,
                initPeerId.publicKey,
            );

            if (isVerified) {
                this.particleSource.next(particle);
            } else {
                log.trace(
                    "particle signature is incorrect. rejecting particle with id: %s",
                    particle.id,
                );
            }
        } catch (e) {
            const particleId = particle?.id;

            const particleIdMessage =
                typeof particleId === "string"
                    ? `. particle id: ${particleId}`
                    : "";

            log.error(
                `error on handling an incoming message: %O%s`,
                e,
                particleIdMessage,
            );
        }
    }

    private async connect() {
        if (this.lib2p2Peer === null) {
            throw new Error("Relay connection is not started");
        }

        await this.lib2p2Peer.handle(
            [PROTOCOL_NAME],
            async ({ connection, stream }) => {
                return pipe(
                    stream.source,
                    decode(),
                    (source) => {
                        return map(source, (buf) => {
                            return toString(buf.subarray());
                        });
                    },
                    async (source) => {
                        try {
                            for await (const msg of source) {
                                await this.processIncomingMessage(msg, stream);
                            }
                        } catch (e) {
                            log.error("connection closed: %j", e);
                        }
                    },
                );
            },
            {
                maxInboundStreams: this.config.maxInboundStreams,
                maxOutboundStreams: this.config.maxOutboundStreams,
            },
        );

        log.debug(
            "dialing to the node with client's address: %s",
            this.lib2p2Peer.peerId.toString(),
        );

        try {
            await this.lib2p2Peer.dial(this.relayAddress);
        } catch (e: any) {
            if (e.name === "AggregateError" && e._errors?.length === 1) {
                const error = e._errors[0];
                throw new Error(
                    `Error dialing node ${this.relayAddress}:\n${error.code}\n${error.message}`,
                );
            } else {
                throw e;
            }
        }
    }
}
