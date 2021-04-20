import { ResultCodes, SecurityTetraplet } from './commonTypes';

/**
 * Particle context. Contains additional information about particle which triggered `call` air instruction from Aquamarine interpreter
 */
interface ParticleContext {
    /**
     * The particle ID
     */
    particleId: string;
    [x: string]: any;
}

/**
 * Represents the information passed from Aquamarine interpreter when a `call` air instruction is executed on the local peer
 */
interface AquaCall {
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
     * Security Tetraplets recieved from Aquamarine interpreter
     */
    tetraplets: SecurityTetraplet[][];

    /**
     * Particle context, @see {@link ParticleContext}
     */
    particleContext: ParticleContext;

    [x: string]: any;
}

/**
 * Type for all the possible ovjects that can be return to the Aquamarine interpreter
 */
export type AquaResultType = object | boolean | number | string;

/**
 * Represents the result of the `call` air instruction to be returned into Aquamarine interpreter
 */
interface AquaCallResult {
    /**
     * Return code to be returned to Aquamarine interpreter
     */
    retCode: ResultCodes;

    /**
     * Result object to be returned to Aquamarine interpreter
     */
    result: AquaResultType;
    [x: string]: any;
}

/**
 * Type for the middleware used in AquaCallHandler middleware chain.
 * In a nutshell middelware is a function of request, response and function to trigger the next middleware in chain.
 * Each middleware is free to write additional properties to either request or response object.
 * When the chain finishes the response is passed back to Aquamarine interpreter
 * @param { AquaCall } req - information about the air `call` instruction
 * @param { AquaCallResult } resp - response to be passed to Aquamarine interpreter
 * @param { Function } next - function which invokes next middleware in chain
 */
export type Middleware = (req: AquaCall, resp: AquaCallResult, next: Function) => void;

/**
 * Convenience middleware factory. Registeres a handler for a pair of 'serviceId/fnName'.
 * The return value of the handler is passed back to Aquamarine
 * @param { string } serviceId - The identifier of service which would be used to make calls from Aquamarine
 * @param { string } fnName - The identifier of function which would be used to make calls from Aquamarine
 * @param { (args: any[], tetraplets: SecurityTetraplet[][]) => object } handler - The handler which should handle the call. The result is any object passed back to Aquamarine
 */
export const fnHandler = (
    serviceId: string,
    fnName: string,
    handler: (args: any[], tetraplets: SecurityTetraplet[][]) => AquaResultType,
) => {
    return (req: AquaCall, resp: AquaCallResult, next: Function): void => {
        if (req.fnName === fnName && req.serviceId === serviceId) {
            const res = handler(req.args, req.tetraplets);
            resp.retCode = ResultCodes.success;
            resp.result = res;
        }
        next();
    };
};

/**
 * Convenience middleware factory. Registeres a handler for a pair of 'serviceId/fnName'.
 * Similar to @see { @link fnHandler } but instead returns and empty object immediately runs the handler asynchronously
 * @param { string } serviceId - The identifier of service which would be used to make calls from Aquamarine
 * @param { string } fnName - The identifier of function which would be used to make calls from Aquamarine
 * @param { (args: any[], tetraplets: SecurityTetraplet[][]) => void } handler - The handler which should handle the call.
 */
export const fnAsEventHandler = (
    serviceId: string,
    fnName: string,
    handler: (args: any[], tetraplets: SecurityTetraplet[][]) => void,
) => {
    return (req: AquaCall, resp: AquaCallResult, next: Function): void => {
        if (req.fnName === fnName && req.serviceId === serviceId) {
            setTimeout(() => {
                handler(req.args, req.tetraplets);
            }, 0);

            resp.retCode = ResultCodes.success;
            resp.result = {};
        }
        next();
    };
};

/**
 * Error catching middleware
 */
export const errorHandler: Middleware = (req: AquaCall, resp: AquaCallResult, next: Function): void => {
    try {
        next();
    } catch (e) {
        resp.retCode = ResultCodes.exceptionInHandler;
        resp.result = e.toString();
    }
};

type AquaCallFunction = (req: AquaCall, resp: AquaCallResult) => void;

/**
 * Class defines the handling of a `call` air intruction executed by aquamarine on the local peer.
 * All the execution process is defined by the chain of middlewares - architecture popular among backend web frameworks.
 * Each middleware has the form of `(req: AquaCall, resp: AquaCallResult, next: Function) => void;`
 * A handler starts with an empty middleware chain and does nothing.
 * To execute the handler use @see { @link execute } function
 */
export class AquaCallHandler {
    private middlewares: Middleware[] = [];

    /**
     * Appends middleware to the chain of middlewares
     * @param { Middleware } middleware
     */
    use(middleware: Middleware): AquaCallHandler {
        this.middlewares.push(middleware);
        return this;
    }

    /**
     * Removes the middleware from the chain of middlewares
     * @param { Middleware } middleware
     */
    unUse(middleware: Middleware): AquaCallHandler {
        const index = this.middlewares.indexOf(middleware);
        if (index !== -1) {
            this.middlewares.splice(index, 1);
        }
        return this;
    }

    /**
     * Combine handler with another one. Combintaion is done by copying middleware chain from the argument's handler into current one.
     * Please note, that current handler's middlewares take precedence over the ones from handler to be combined with
     * @param { AquaCallHandler } other - AquaCallHandler to be combined with
     */
    combineWith(other: AquaCallHandler): AquaCallHandler {
        this.middlewares = [...this.middlewares, ...other.middlewares];
        return this;
    }

    /**
     * Convinience method for registring @see { @link fnHandler } middleware
     */
    on(
        serviceId: string,
        fnName: string,
        handler: (args: any[], tetraplets: SecurityTetraplet[][]) => AquaResultType,
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
        serviceId: string,
        fnName: string,
        handler: (args: any[], tetraplets: SecurityTetraplet[][]) => void,
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
    buildFunction(): AquaCallFunction {
        const result = this.middlewares.reduceRight<AquaCallFunction>(
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
     * Executes the handler with the specified AquaCall request. Return the result response
     */
    execute(req: AquaCall): AquaCallResult {
        const res: AquaCallResult = {
            retCode: ResultCodes.unkownError,
            result: `The handler did not set any result. Make sure you are calling the right peer and the handler has been registered. Original request data was: serviceId='${req.serviceId}' fnName='${req.fnName}' args='${req.args}'`,
        };
        this.buildFunction()(req, res);
        return res;
    }
}
