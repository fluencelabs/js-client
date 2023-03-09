import type { SecurityTetraplet } from '@fluencelabs/avm';
import type { LogLevel } from '@fluencelabs/marine-js/dist/types';
// import type { MultiaddrInput } from '@multiformats/multiaddr';
import type { FnConfig, FunctionCallDef, ServiceDef } from './compilerSupport.js';

/**
 * Peer ID's id as a base58 string (multihash/CIDv0).
 */
export type PeerIdB58 = string;

/**
 * Additional information about a service call
 * @typeparam ArgName
 */
export interface CallParams<ArgName extends string | null> {
    /**
     * The identifier of particle which triggered the call
     */
    particleId: string;

    /**
     * The peer id which created the particle
     */
    initPeerId: PeerIdB58;

    /**
     * Particle's timestamp when it was created
     */
    timestamp: number;

    /**
     * Time to live in milliseconds. The time after the particle should be expired
     */
    ttl: number;

    /**
     * Particle's signature
     */
    signature?: string;

    /**
     * Security tetraplets
     */
    tetraplets: ArgName extends string ? Record<ArgName, SecurityTetraplet[]> : Record<string, never>;
}

/**
 * Node of the Fluence network specified as a pair of node's multiaddr and it's peer id
 */
type Node = {
    peerId: PeerIdB58;
    multiaddr: string;
};

// TODO: either drop support for this exact type or get it back

/**
 * A node in Fluence network a client can connect to.
 * Can be in the form of:
 * - string: multiaddr in string format
 * - Multiaddr: multiaddr object, @see https://github.com/multiformats/js-multiaddr
 * - Node: node structure, @see Node
 */
export type RelayOptions = string | /* MultiaddrInput | */ Node;

export type KeyTypes = 'RSA' | 'Ed25519' | 'secp256k1';

export type KeyPairOptions = {
    type: 'Ed25519';
    source: 'random' | Uint8Array;
};

/**
 * Configuration used when initiating Fluence Client
 */
export interface ClientOptions {
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

export type FluenceStartConfig = ClientOptions & { relay: RelayOptions };

export const ConnectionStates = ['disconnected', 'connecting', 'connected', 'disconnecting'] as const;
export type ConnectionState = typeof ConnectionStates[number];

export interface IFluenceClient {
    /**
     * Connect to the Fluence network
     * @param relay - relay node to connect to
     * @param options - client options
     */
    connect: (relay: RelayOptions, options?: ClientOptions) => Promise<void>;

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

    // TODO: come up with a working interface for
    // - particle creation
    // - particle initialization
    // - service registration
    /**
     * For internal use only. Do not call directly
     */
    internals: any;
}

export interface CallAquaFunctionArgs {
    def: FunctionCallDef;
    script: string;
    config: FnConfig;
    peer: IFluenceClient;
    args: { [key: string]: any };
}

export type CallAquaFunction = (args: CallAquaFunctionArgs) => Promise<unknown>;

export interface RegisterServiceArgs {
    peer: IFluenceClient;
    def: ServiceDef;
    serviceId: string | undefined;
    service: any;
}

export type RegisterService = (args: RegisterServiceArgs) => void;

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
