import { SecurityTetraplet } from '@fluencelabs/avm';
import { PeerIdB58 } from './commonTypes';

export enum ResultCodes {
    success = 0,
    unkownError = 1,
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
 * Type for all the possible ovjects that can be return to the AVM
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
export type Middleware = (req: CallServiceData, resp: CallServiceResult, next: Function) => void;

export class CallServiceArg<T> {
    val: T;
    tetraplet: SecurityTetraplet[];

    constructor(val: T, tetraplet: SecurityTetraplet[]) {
        this.val = val;
        this.tetraplet = tetraplet;
    }
}

type CallParams = ParticleContext & {
    wrappedArgs: CallServiceArg<any>[];
};

/**
 * Convenience middleware factory. Registeres a handler for a pair of 'serviceId/fnName'.
 * The return value of the handler is passed back to AVM
 * @param { string } serviceId - The identifier of service which would be used to make calls from AVM
 * @param { string } fnName - The identifier of function which would be used to make calls from AVM
 * @param { (args: any[], tetraplets: SecurityTetraplet[][]) => object } handler - The handler which should handle the call. The result is any object passed back to AVM
 */
export const fnHandler = (
    serviceId: string,
    fnName: string,
    handler: (args: any[], callParams: CallParams) => CallServiceResultType,
) => {
    return (req: CallServiceData, resp: CallServiceResult, next: Function): void => {
        if (req.fnName === fnName && req.serviceId === serviceId) {
            const res = handler(req.args, { ...req.particleContext, wrappedArgs: req.wrappedArgs });
            resp.retCode = ResultCodes.success;
            resp.result = res;
        }
        next();
    };
};

/**
 * Convenience middleware factory. Registeres a handler for a pair of 'serviceId/fnName'.
 * Similar to @see { @link fnHandler } but instead returns and empty object immediately runs the handler asynchronously
 * @param { string } serviceId - The identifier of service which would be used to make calls from AVM
 * @param { string } fnName - The identifier of function which would be used to make calls from AVM
 * @param { (args: any[], tetraplets: SecurityTetraplet[][]) => void } handler - The handler which should handle the call.
 */
export const fnAsEventHandler = (
    serviceId: string, // force format
    fnName: string,
    handler: (args: any[], callParams: CallParams) => void,
) => {
    return (req: CallServiceData, resp: CallServiceResult, next: Function): void => {
        if (req.fnName === fnName && req.serviceId === serviceId) {
            setTimeout(() => {
                handler(req.args, { ...req.particleContext, wrappedArgs: req.wrappedArgs });
            }, 0);

            resp.retCode = ResultCodes.success;
            resp.result = {};
        }
        next();
    };
};

type CallServiceFunction = (req: CallServiceData, resp: CallServiceResult) => void;

/**
 * Class defines the handling of a `call` air intruction executed by AVM on the local peer.
 * All the execution process is defined by the chain of middlewares - architecture popular among backend web frameworks.
 * Each middleware has the form of `(req: Call, resp: CallServiceResult, next: Function) => void;`
 * A handler starts with an empty middleware chain and does nothing.
 * To execute the handler use @see { @link execute } function
 */
export class CallServiceHandler {
    private middlewares: Middleware[] = [];

    /**
     * Appends middleware to the chain of middlewares
     * @param { Middleware } middleware
     */
    use(middleware: Middleware): CallServiceHandler {
        this.middlewares.push(middleware);
        return this;
    }

    /**
     * Removes the middleware from the chain of middlewares
     * @param { Middleware } middleware
     */
    unUse(middleware: Middleware): CallServiceHandler {
        const index = this.middlewares.indexOf(middleware);
        if (index !== -1) {
            this.middlewares.splice(index, 1);
        }
        return this;
    }

    /**
     * Combine handler with another one. Combintaion is done by copying middleware chain from the argument's handler into current one.
     * Please note, that current handler's middlewares take precedence over the ones from handler to be combined with
     * @param { CallServiceHandler } other - CallServiceHandler to be combined with
     */
    combineWith(other: CallServiceHandler): CallServiceHandler {
        this.middlewares = [...this.middlewares, ...other.middlewares];
        return this;
    }

    /**
     * Convinience method for registring @see { @link fnHandler } middleware
     */
    on(
        serviceId: string, // force format
        fnName: string,
        handler: (args: any[], callParams: CallParams) => CallServiceResultType,
    ): Function {
        const mw = fnHandler(serviceId, fnName, handler);
        this.use(mw);
        return () => {
            this.unUse(mw);
        };
    }

    /**
     * Convinience method for registring @see { @link fnAsEventHandler } middleware
     */
    onEvent(
        serviceId: string, // force format
        fnName: string,
        handler: (args: any[], callParams: CallParams) => void,
    ): Function {
        const mw = fnAsEventHandler(serviceId, fnName, handler);
        this.use(mw);
        return () => {
            this.unUse(mw);
        };
    }

    /**
     * Collapses middleware chain into a single function.
     */
    buildFunction(): CallServiceFunction {
        const result = this.middlewares.reduceRight<CallServiceFunction>(
            (agg, cur) => {
                return (req, resp) => {
                    cur(req, resp, () => agg(req, resp));
                };
            },
            (req, res) => {},
        );

        return result;
    }

    /**
     * Executes the handler with the specified Call request. Return the result response
     */
    execute(req: CallServiceData): CallServiceResult {
        const res: CallServiceResult = {
            retCode: ResultCodes.unkownError,
            result: `The handler did not set any result. Make sure you are calling the right peer and the handler has been registered. Original request data was: serviceId='${req.serviceId}' fnName='${req.fnName}' args='${req.args}'`,
        };
        this.buildFunction()(req, res);
        return res;
    }
}
