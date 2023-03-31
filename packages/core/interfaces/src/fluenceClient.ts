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

export const ConnectionStates = ['disconnected', 'connecting', 'connected', 'disconnecting'] as const;
export type ConnectionState = (typeof ConnectionStates)[number];

export interface IFluenceInternalApi {
    /**
     * Internal API
     */
    internals: any;
}

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

export const asFluencePeer = (fluencePeerCandidate: unknown): IFluenceClient => {
    if (isFluencePeer(fluencePeerCandidate)) {
        return fluencePeerCandidate;
    }

    throw new Error(`Argument ${fluencePeerCandidate} is not a Fluence Peer`);
};

export const isFluencePeer = (fluencePeerCandidate: unknown): fluencePeerCandidate is IFluenceClient => {
    if (fluencePeerCandidate && (fluencePeerCandidate as any).__isFluenceAwesome) {
        return true;
    }

    return false;
};
