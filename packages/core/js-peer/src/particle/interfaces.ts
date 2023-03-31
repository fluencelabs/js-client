import { PeerIdB58 } from '@fluencelabs/interfaces';

/**
 * Immutable part of the particle.
 */
export interface IImmutableParticlePart {
    /**
     * Particle id
     */
    readonly id: string;

    /**
     * Particle timestamp. Specifies when the particle was created.
     */
    readonly timestamp: number;

    /**
     * Particle's air script
     */
    readonly script: string;

    /**
     * Particle's ttl. Specifies how long the particle is valid in milliseconds.
     */
    readonly ttl: number;

    /**
     * Peer id where the particle was initiated.
     */
    readonly initPeerId: PeerIdB58;

    // TODO: implement particle signatures
    readonly signature: undefined;
}

/**
 * Particle is a data structure that is used to transfer data between peers in Fluence network.
 */
export interface IParticle extends IImmutableParticlePart {
    /**
     * Mutable particle data
     */
    data: Uint8Array;
}
