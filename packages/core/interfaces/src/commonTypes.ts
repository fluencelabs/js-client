import type { SecurityTetraplet } from '@fluencelabs/avm';

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
