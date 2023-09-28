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

    /**
     * Particle's signature. Concatenation of bytes of all immutable particle fields.
     */
    readonly signature: Uint8Array;
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
