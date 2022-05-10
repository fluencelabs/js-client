/*
 * Copyright 2020 Fluence Labs Limited
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

import { SecurityTetraplet } from '@fluencelabs/avm';

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

export enum ResultCodes {
    success = 0,
    error = 1,
}

/**
 * Particle context. Contains additional information about particle which triggered `call` air instruction from AVM
 */
export interface ParticleContext {
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
}

/**
 * Represents the information passed from AVM when a `call` air instruction is executed on the local peer
 */
export interface CallServiceData {
    /**
     * Service ID as specified in `call` air instruction
     */
    serviceId: string;

    /**
     * Function name as specified in `call` air instruction
     */
    fnName: string;

    /**
     * Arguments as specified in `call` air instruction
     */
    args: any[];

    /**
     * Security Tetraplets received from AVM
     */
    tetraplets: SecurityTetraplet[][];

    /**
     * Particle context, @see {@link ParticleContext}
     */
    particleContext: ParticleContext;
}

/**
 * Type for all the possible objects that can be returned to the AVM
 */
export type CallServiceResultType = object | boolean | number | string | null;

/**
 * Generic call service handler
 */
export type GenericCallServiceHandler = (req: CallServiceData) => CallServiceResult | Promise<CallServiceResult>;

/**
 * Represents the result of the `call` air instruction to be returned into AVM
 */
export interface CallServiceResult {
    /**
     * Return code to be returned to AVM
     */
    retCode: ResultCodes;

    /**
     * Result object to be returned to AVM
     */
    result: CallServiceResultType;
}
