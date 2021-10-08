import { SecurityTetraplet } from '@fluencelabs/avm';
import { PeerIdB58 } from './commonTypes';

export enum ResultCodes {
    success = 0,
    unknownError = 1,
    exceptionInHandler = 2,
}

/**
 * Particle context. Contains additional information about particle which triggered `call` air instruction from AVM
 */
interface ParticleContext {
    /**
     * The particle ID
     */
    particleId: string;
    initPeerId: PeerIdB58;
    timestamp: number;
    ttl: number;
    signature: string;
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
     * Security Tetraplets recieved from AVM
     */
    tetraplets: SecurityTetraplet[][];

    /**
     * Particle context, @see {@link ParticleContext}
     */
    particleContext: ParticleContext;

    [x: string]: any;
}

/**
 * Type for all the possible objects that can be return to the AVM
 */
export type CallServiceResultType = object | boolean | number | string | null;

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
    [x: string]: any;
}

/**
 * Type for the middleware used in CallServiceHandler middleware chain.
 * In a nutshell middelware is a function of request, response and function to trigger the next middleware in chain.
 * Each middleware is free to write additional properties to either request or response object.
 * When the chain finishes the response is passed back to AVM
 * @param { CallServiceData } req - information about the air `call` instruction
 * @param { CallServiceResult } resp - response to be passed to AVM
 * @param { Function } next - function which invokes next middleware in chain
 */
export type Middleware = (req: CallServiceData, resp: CallServiceResult, next: Function) => Promise<void>;

export class CallServiceHandler {}
