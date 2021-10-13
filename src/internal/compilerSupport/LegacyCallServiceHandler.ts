/*
 * Copyright 2021 Fluence Labs Limited
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

import { CallServiceData, CallServiceResult, CallServiceResultType, ResultCodes } from '../CallServiceHandler';

export const callLegacyCallServiceHandler = (
    req: CallServiceData,
    commonHandler: CallServiceHandler,
    particleSpecificHandler?: CallServiceHandler,
): CallServiceResult => {
    // trying particle-specific handler
    if (particleSpecificHandler !== undefined) {
        var res = particleSpecificHandler.execute(req);
    }

    if (res?.result === undefined) {
        // if it didn't return any result trying to run the common handler
        res = commonHandler.execute(req);
    }

    if (res.retCode === undefined) {
        res = {
            retCode: ResultCodes.unknownError,
            result: `The handler did not set any result. Make sure you are calling the right peer and the handler has been registered. Original request data was: serviceId='${req.serviceId}' fnName='${req.fnName}' args='${req.args}'`,
        };
    }

    if (res.result === undefined) {
        res.result = null;
    }

    return res;
};

/**
 * Type for the middleware used in CallServiceHandler middleware chain.
 * In a nutshell middleware is a function of request, response and function to trigger the next middleware in chain.
 * Each middleware is free to write additional properties to either request or response object.
 * When the chain finishes the response is passed back to AVM
 * @param { CallServiceData } req - information about the air `call` instruction
 * @param { CallServiceResult } resp - response to be passed to AVM
 * @param { Function } next - function which invokes next middleware in chain
 */
export type Middleware = (req: CallServiceData, resp: CallServiceResult, next: Function) => void;

type CallParams = any;

/**
 * Convenience middleware factory. Registers a handler for a pair of 'serviceId/fnName'.
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
            const res = handler(req.args, req.particleContext);
            resp.retCode = ResultCodes.success;
            resp.result = res;
        }
        next();
    };
};

/**
 * Convenience middleware factory. Registers a handler for a pair of 'serviceId/fnName'.
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
                handler(req.args, req.particleContext);
            }, 0);

            resp.retCode = ResultCodes.success;
            resp.result = {};
        }
        next();
    };
};

type CallServiceFunction = (req: CallServiceData, resp: CallServiceResult) => void;

/**
 * Class defines the handling of a `call` air instruction executed by AVM on the local peer.
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
     * Combine handler with another one. Combination is done by copying middleware chain from the argument's handler into current one.
     * Please note, that current handler's middlewares take precedence over the ones from handler to be combined with
     * @param { CallServiceHandler } other - CallServiceHandler to be combined with
     */
    combineWith(other: CallServiceHandler): CallServiceHandler {
        this.middlewares = [...this.middlewares, ...other.middlewares];
        return this;
    }

    /**
     * Convenience method for registering @see { @link fnHandler } middleware
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
     * Convenience method for registering @see { @link fnAsEventHandler } middleware
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
            retCode: undefined,
            result: undefined,
        };
        this.buildFunction()(req, res);
        return res;
    }
}
