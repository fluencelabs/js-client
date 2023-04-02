import type { PeerIdB58 } from '@fluencelabs/interfaces';
import type { SecurityTetraplet } from '@fluencelabs/avm';
import { JSONValue } from '../util/commonTypes.js';

export interface IJsServiceHost {
    /**
     * Returns true if any handler for the specified serviceId is registered
     */
    containsService(serviceId: string): boolean;

    /**
     * Find call service handler for specified particle
     * @param serviceId Service ID as specified in `call` air instruction
     * @param fnName Function name as specified in `call` air instruction
     * @param particleId Particle ID
     */
    getHandler(serviceId: string, fnName: string, particleId: string): GenericCallServiceHandler | null;

    /**
     * Execute service call for specified call service data
     */
    callService(req: CallServiceData): Promise<CallServiceResult | null>;

    /**
     * Register handler for all particles
     */
    registerGlobalHandler(serviceId: string, fnName: string, handler: GenericCallServiceHandler): void;

    /**
     * Register handler which will be called only for particle with the specific id
     */
    registerParticleScopeHandler(
        particleId: string,
        serviceId: string,
        fnName: string,
        handler: GenericCallServiceHandler,
    ): void;

    /**
     * Removes all handlers associated with the specified particle scope
     * @param particleId Particle ID to remove handlers for
     */
    removeParticleScopeHandlers(particleId: string): void;
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
export type CallServiceResultType = JSONValue;

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
