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
import { identify } from "@libp2p/identify";
import type { PeerId } from "@libp2p/interface";
import { peerIdFromString } from "@libp2p/peer-id";
import { ping } from "@libp2p/ping";
import { webSockets } from "@libp2p/websockets";
import { all } from "@libp2p/websockets/filters";
import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";
import { decode, encode } from "it-length-prefixed";
import map from "it-map";
import { pipe } from "it-pipe";
import { createLibp2p, Libp2p } from "libp2p";
import { Subject } from "rxjs";
import { fromString } from "uint8arrays/from-string";
import { toString } from "uint8arrays/to-string";

import { KeyPair } from "../keypair/index.js";
import { IParticle } from "../particle/interfaces.js";
import {
  buildParticleMessage,
  Particle,
  serializeToString,
} from "../particle/Particle.js";
import { throwHasNoPeerId } from "../util/libp2pUtils.js";
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

type DenyCondition = (ma: Multiaddr) => boolean;

const dockerNoxDenyCondition: DenyCondition = (ma) => {
  const [routingProtocol] = ma.stringTuples();
  const host = routingProtocol?.[1];

  // Nox proposes 3 multiaddr to discover when used inside docker network,
  // e.g.: [/dns/nox-1, /ip4/10.50.10.10, /ip4/127.0.0.1]
  // First 2 of them are unreachable outside the docker network
  // Libp2p cannot handle these scenarios correctly, creating interruptions which affect e2e tests execution.
  return (
    host === undefined || host.startsWith("nox-") || host.startsWith("10.50.10")
  );
};

const denyConditions = [dockerNoxDenyCondition];

/**
 * Implementation for JS peers which connects to Fluence through relay node
 */
export class RelayConnection implements IConnection {
  private relayAddress: Multiaddr;
  private lib2p2Peer: Libp2p | null = null;
  private relayPeerId: string;

  constructor(private config: RelayConnectionConfig) {
    this.relayAddress = multiaddr(this.config.relayAddress);
    const peerId = this.relayAddress.getPeerId();

    if (peerId === null) {
      throwHasNoPeerId(this.relayAddress);
    }

    this.relayPeerId = peerId;
  }

  getRelayPeerId(): string {
    return this.relayPeerId;
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
        ...(this.config.dialTimeoutMs !== undefined
          ? {
              dialTimeout: this.config.dialTimeoutMs,
              autoDialInterval: 0,
            }
          : {}),
      },
      connectionGater: {
        // By default, this function forbids connections to private peers. For example, multiaddr with ip 127.0.0.1 isn't allowed
        denyDialMultiaddr: (ma: Multiaddr) => {
          return Promise.resolve(
            denyConditions.some((dc) => {
              return dc(ma);
            }),
          );
        },
      },
      services: {
        identify: identify(),
        ping: ping(),
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

    if (nextPeerIds.length !== 1 && nextPeerIds[0] !== this.getRelayPeerId()) {
      throw new Error(
        `Relay connection only accepts peer id of the connected relay. Got: ${JSON.stringify(
          nextPeerIds,
        )} instead.`,
      );
    }

    // Reusing active connection here
    const stream = await this.lib2p2Peer.dialProtocol(
      this.relayAddress,
      PROTOCOL_NAME,
    );

    log.trace(
      "sending particle %s to %s",
      particle.id,
      this.relayAddress.toString(),
    );

    const sink = stream.sink;

    await pipe([fromString(serializeToString(particle))], encode, sink);

    log.trace(
      "particle %s sent to %s",
      particle.id,
      this.relayAddress.toString(),
    );
  }

  private async processIncomingMessage(msg: string) {
    let particle: Particle | undefined;

    try {
      particle = Particle.fromString(msg);

      log.trace(
        "received particle %s from %s",
        particle.id,
        this.relayAddress.toString(),
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

      const isVerified = await KeyPair.verifyWithPublicKey(
        initPeerId.publicKey,
        buildParticleMessage(particle),
        particle.signature,
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
        typeof particleId === "string" ? `. particle id: ${particleId}` : "";

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
      ({ stream }) => {
        void pipe(
          stream.source,
          decode,
          (source) => {
            return map(source, (buf) => {
              return toString(buf.subarray());
            });
          },
          async (source) => {
            try {
              for await (const msg of source) {
                await this.processIncomingMessage(msg);
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

    await this.lib2p2Peer.dial(this.relayAddress);
  }
}
