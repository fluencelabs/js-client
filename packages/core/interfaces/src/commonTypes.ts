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
