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
import type { Node } from './commonTypes.js';

/**
 * A node in Fluence network a client can connect to.
 * Can be in the form of:
 * - string: multiaddr in string format
 * - Node: node structure, @see Node
 */
export type RelayOptions = string | Node;

/**
 * Fluence Peer's key pair types
 */
export type KeyTypes = 'RSA' | 'Ed25519' | 'secp256k1';

/**
 * Options to specify key pair used in Fluence Peer
 */
export type KeyPairOptions = {
    type: 'Ed25519';
    source: 'random' | Uint8Array;
};

/**
 * Configuration used when initiating Fluence Client
 */
export interface ClientConfig {
    /**
     * Specify the KeyPair to be used to identify the Fluence Peer.
     * Will be generated randomly if not specified
     */
    keyPair?: KeyPairOptions;

    /**
     * Options to configure the connection to the Fluence network
     */
    connectionOptions?: {
        /**
         * When the peer established the connection to the network it sends a ping-like message to check if it works correctly.
         * The options allows to specify the timeout for that message in milliseconds.
         * If not specified the default timeout will be used
         */
        skipCheckConnection?: boolean;

        /**
         * The dialing timeout in milliseconds
         */
        dialTimeoutMs?: number;

        /**
         * The maximum number of inbound streams for the libp2p node.
         * Default: 1024
         */
        maxInboundStreams?: number;

        /**
         * The maximum number of outbound streams for the libp2p node.
         * Default: 1024
         */
        maxOutboundStreams?: number;
    };

    /**
     * Sets the default TTL for all particles originating from the peer with no TTL specified.
     * If the originating particle's TTL is defined then that value will be used
     * If the option is not set default TTL will be 7000
     */
    defaultTtlMs?: number;

    /**
     * Enables\disabled various debugging features
     */
    debug?: {
        /**
         * If set to true, newly initiated particle ids will be printed to console.
         * Useful to see what particle id is responsible for aqua function
         */
        printParticleId?: boolean;
    };
}

/**
 * Fluence JS Client connection states as string literals
 */
export const ConnectionStates = ['disconnected', 'connecting', 'connected', 'disconnecting'] as const;

/**
 * Fluence JS Client connection states
 */
export type ConnectionState = (typeof ConnectionStates)[number];

export interface IFluenceInternalApi {
    /**
     * Internal API
     */
    internals: any;
}

/**
 * Public API of Fluence JS Client
 */
export interface IFluenceClient extends IFluenceInternalApi {
    /**
     * Connect to the Fluence network
     */
    connect: () => Promise<void>;

    /**
     * Disconnect from the Fluence network
     */
    disconnect(): Promise<void>;

    /**
     * Handle connection state changes. Immediately returns current connection state
     */
    onConnectionStateChange(handler: (state: ConnectionState) => void): ConnectionState;

    /**
     * Return peer's secret key as byte array.
     */
    getPeerSecretKey(): Uint8Array;

    /**
     * Return peer's public key as a base58 string (multihash/CIDv0).
     */
    getPeerId(): string;

    /**
     * Return relay's public key as a base58 string (multihash/CIDv0).
     */
    getRelayPeerId(): string;
}

/**
 * For internal use. Checks if the object is a Fluence Peer
 */
export const asFluencePeer = (fluencePeerCandidate: unknown): IFluenceClient => {
    if (isFluencePeer(fluencePeerCandidate)) {
        return fluencePeerCandidate;
    }

    throw new Error(`Argument ${fluencePeerCandidate} is not a Fluence Peer`);
};

/**
 * For internal use. Checks if the object is a Fluence Peer
 */
export const isFluencePeer = (fluencePeerCandidate: unknown): fluencePeerCandidate is IFluenceClient => {
    if (fluencePeerCandidate && (fluencePeerCandidate as any).__isFluenceAwesome) {
        return true;
    }

    return false;
};
