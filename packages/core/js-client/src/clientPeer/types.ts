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

import { z } from "zod";

/**
 * Peer ID's id as a base58 string (multihash/CIDv0).
 */
export type PeerIdB58 = string;

/**
 * Node of the Fluence network specified as a pair of node's multiaddr and it's peer id
 */
export type Node = {
  peerId: PeerIdB58;
  multiaddr: string;
};

export const relaySchema = z.union([
  z.string(),
  z.object({
    peerId: z.string(),
    multiaddr: z.string(),
  }),
]);

/**
 * A node in Fluence network a client can connect to.
 * Can be in the form of:
 * - string: multiaddr in string format
 * - Node: node structure, @see Node
 */
export type RelayOptions = z.infer<typeof relaySchema>;

/**
 * Fluence Peer's key pair types
 */
export type KeyTypes = "RSA" | "Ed25519" | "secp256k1";

const keyPairOptionsSchema = z.object({
  /**
   * Key pair type. Only Ed25519 is supported for now.
   */
  type: z.literal("Ed25519"),
  /**
   * Key pair source. Could be byte array or generated randomly.
   */
  source: z.union([z.literal("random"), z.instanceof(Uint8Array)]),
});

/**
 * Options to specify key pair used in Fluence Peer
 */
export type KeyPairOptions = z.infer<typeof keyPairOptionsSchema>;

/**
 * Public API of Fluence JS Client
 */
export interface IFluenceClient {
  /**
   * Connect to the Fluence network
   */
  connect: () => Promise<void>;

  /**
   * Disconnect from the Fluence network
   */
  disconnect(): Promise<void>;

  /**
   * Return peer's public key as a base58 string (multihash/CIDv0).
   */
  getPeerId(): string;

  /**
   * Return relay's public key as a base58 string (multihash/CIDv0).
   */
  getRelayPeerId(): string;
}

export const configSchema = z
  .object({
    /**
     * Specify the KeyPair to be used to identify the Fluence Peer.
     * Will be generated randomly if not specified
     */
    keyPair: keyPairOptionsSchema,
    /**
     * Options to configure the connection to the Fluence network
     */
    connectionOptions: z
      .object({
        /**
         * When the peer established the connection to the network it sends a ping-like message to check if it works correctly.
         * The options allows to specify the timeout for that message in milliseconds.
         * If not specified the default timeout will be used
         */
        skipCheckConnection: z.boolean(),
        /**
         * The dialing timeout in milliseconds
         */
        dialTimeoutMs: z.number(),
        /**
         * The maximum number of inbound streams for the libp2p node.
         * Default: 1024
         */
        maxInboundStreams: z.number(),
        /**
         * The maximum number of outbound streams for the libp2p node.
         * Default: 1024
         */
        maxOutboundStreams: z.number(),
      })
      .partial(),
    /**
     * Sets the default TTL for all particles originating from the peer with no TTL specified.
     * If the originating particle's TTL is defined then that value will be used
     * If the option is not set default TTL will be 7000
     */
    defaultTtlMs: z.number(),
    /**
     * Property for passing custom CDN Url to load dependencies from browser. https://unpkg.com used by default
     */
    CDNUrl: z.string(),
    /**
     * Enables\disabled various debugging features
     */
    debug: z
      .object({
        /**
         * If set to true, newly initiated particle ids will be printed to console.
         * Useful to see what particle id is responsible for aqua function
         */
        printParticleId: z.boolean(),
      })
      .partial(),
  })
  .partial();

/**
 * Configuration used when initiating Fluence Client
 */
export type ClientConfig = z.infer<typeof configSchema>;
