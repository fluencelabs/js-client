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

import { SecurityTetraplet } from '@fluencelabs/avm-worker-common';
import { match } from 'ts-pattern';
import { CallParams, Fluence, FluencePeer } from '../../index';
import { CallServiceData, GenericCallServiceHandler, CallServiceResult, ResultCodes } from '../commonTypes';
import { Particle } from '../Particle';

export { FluencePeer } from '../FluencePeer';
export { CallParams } from '../commonTypes';

/**
 * Represents the Aqua Option type
 */
type OptionalType = {
    /**
     * Type descriptor. Used for pattern-matching
     */
    tag: 'optional';
};

/**
 * Represents the void type for functions and callbacks with no return value
 */
type VoidType = {
    /**
     * Type descriptor. Used for pattern-matching
     */
    tag: 'void';
};

/**
 * Represents all types other than Optional, Void, Callback and MultiReturn
 */
type PrimitiveType = {
    /**
     * Type descriptor. Used for pattern-matching
     */
    tag: 'primitive';
};

/**
 * Represents callbacks used in Aqua function arguments (`func` instruction)
 */
type CallbackType = {
    /**
     * Type descriptor. Used for pattern-matching
     */
    tag: 'callback';

    /**
     * Callback definition
     */
    callback: CallbackDef<OptionalType | PrimitiveType, VoidType | OptionalType | PrimitiveType>;
};

/**
 * Represents the return type for functions which return multiple values
 */
type MultiReturnType = {
    /**
     * Type descriptor. Used for pattern-matching
     */
    tag: 'multiReturn';

    /**
     * The description of types of the return values: Array of either primitive or optional types
     */
    returnItems: Array<OptionalType | PrimitiveType>;
};

interface ArgDef<ArgType> {
    /**
     * The name of the argument in Aqua language
     */
    name: string;

    /**
     * The type of the argument
     */
    argType: ArgType;
}

interface CallbackDef<ArgType, ReturnType> {
    /**
     * Callback argument definitions: the list of ArgDefs
     */
    argDefs: Array<ArgDef<ArgType>>;

    /**
     * Definition of the return type of callback
     */
    returnType: ReturnType;
}

interface FunctionBodyDef
    extends CallbackDef<
        // force new line
        OptionalType | PrimitiveType,
        VoidType | OptionalType | PrimitiveType
    > {
    /**
     * The name of the function in Aqua language
     */
    functionName: string;
}

/**
 * Definition of function (`func` instruction) generated by the Aqua compiler
 */
interface FunctionCallDef
    extends CallbackDef<
        OptionalType | PrimitiveType | CallbackType,
        VoidType | OptionalType | PrimitiveType | MultiReturnType
    > {
    /**
     * The name of the function in Aqua language
     */
    functionName: string;

    /**
     * Names of the different entities used in generated air script
     */
    names: {
        /**
         * The name of the relay variable
         */
        relay: string;

        /**
         * The name of the serviceId used load variables at the beginning of the script
         */
        getDataSrv: string;

        /**
         * The name of serviceId is used to execute callbacks for the current particle
         */
        callbackSrv: string;

        /**
         * The name of the serviceId which is called to propagate return value to the generated function caller
         */
        responseSrv: string;

        /**
         * The name of the functionName which is called to propagate return value to the generated function caller
         */
        responseFnName: string;

        /**
         * The name of the serviceId which is called to report errors to the generated function caller
         */
        errorHandlingSrv: string;

        /**
         * The name of the functionName which is called to report errors to the generated function caller
         */
        errorFnName: string;
    };
}

/**
 * Definition of service registration function (`service` instruction) generated by the Aqua compiler
 */
interface ServiceDef {
    /**
     * Default service id. If the service has no default id the value should be undefined
     */
    defaultServiceId?: string;

    /**
     * List of functions which the service consists of
     */
    functions: Array<FunctionBodyDef>;
}

/**
 * Options to configure Aqua function execution
 */
export interface FnConfig {
    /**
     * Sets the TTL (time to live) for particle responsible for the function execution
     * If the option is not set the default TTL from FluencePeer config is used
     */
    ttl?: number;
}

/**
 * Convenience function to support Aqua `func` generation backend
 * The compiler only need to generate a call the function and provide the corresponding definitions and the air script
 *
 * @param rawFnArgs - raw arguments passed by user to the generated function
 * @param def - function definition generated by the Aqua compiler
 * @param script - air script with function execution logic generated by the Aqua compiler
 */
export function callFunction(rawFnArgs: Array<any>, def: FunctionCallDef, script: string) {
    const { args, peer, config } = extractFunctionArgs(rawFnArgs, def.argDefs.length);

    if (args.length !== def.argDefs.length) {
        throw new Error('Incorrect number of arguments. Expecting ${def.argDefs.length}');
    }

    const promise = new Promise((resolve, reject) => {
        const particle = Particle.createNew(script, config?.ttl);

        for (let i = 0; i < def.argDefs.length; i++) {
            const argDef = def.argDefs[i];
            const arg = args[i];

            const [serviceId, fnName, cb] = match(argDef.argType)
                // for callback arguments we are registering particle-specific callback which executes the passed function
                .with({ tag: 'callback' }, (callbackDef) => {
                    const fn = async (req: CallServiceData): Promise<CallServiceResult> => {
                        const args = convertArgsFromReqToUserCall(req, callbackDef.callback.argDefs);
                        // arg is function at this point
                        const result = await arg.apply(null, args);
                        let res;
                        switch (callbackDef.callback.returnType.tag) {
                            case 'void':
                                res = {};
                                break;
                            case 'primitive':
                                res = result;
                                break;
                            case 'optional':
                                res = tsToAquaOpt(result);
                                break;
                        }
                        return {
                            retCode: ResultCodes.success,
                            result: res,
                        };
                    };
                    return [def.names.callbackSrv, argDef.name, fn] as const;
                })
                // for optional types we are converting value to array representation in air
                .with({ tag: 'optional' }, () => {
                    const fn = (req: CallServiceData): CallServiceResult => {
                        // arg is optional at this point
                        const res = tsToAquaOpt(arg);
                        return {
                            retCode: ResultCodes.success,
                            result: res,
                        };
                    };
                    return [def.names.getDataSrv, argDef.name, fn] as const;
                })
                // for primitive types wre are simply passing the value
                .with({ tag: 'primitive' }, () => {
                    // arg is primitive at this point
                    const fn = (req: CallServiceData): CallServiceResult => ({
                        retCode: ResultCodes.success,
                        result: arg,
                    });
                    return [def.names.getDataSrv, argDef.name, fn] as const;
                })
                .exhaustive();

            // registering handlers for every argument of the function
            peer.internals.regHandler.forParticle(particle.id, serviceId, fnName, cb);
        }

        // registering handler for function response
        peer.internals.regHandler.forParticle(particle.id, def.names.responseSrv, def.names.responseFnName, (req) => {
            const userFunctionReturn = match(def.returnType)
                .with({ tag: 'primitive' }, () => req.args[0])
                .with({ tag: 'optional' }, () => aquaOptToTs(req.args[0]))
                .with({ tag: 'void' }, () => undefined)
                .with({ tag: 'multiReturn' }, (mr) => {
                    return mr.returnItems.map((x, index) => {
                        return match(x)
                            .with({ tag: 'optional' }, () => aquaOptToTs(req.args[index]))
                            .with({ tag: 'primitive' }, () => req.args[index])
                            .exhaustive();
                    });
                })
                .exhaustive();

            setTimeout(() => {
                resolve(userFunctionReturn);
            }, 0);

            return {
                retCode: ResultCodes.success,
                result: {},
            };
        });

        // registering handler for injecting relay variable
        peer.internals.regHandler.forParticle(particle.id, def.names.getDataSrv, def.names.relay, (req) => {
            return {
                retCode: ResultCodes.success,
                result: peer.getStatus().relayPeerId,
            };
        });

        // registering handler for error reporting
        peer.internals.regHandler.forParticle(particle.id, def.names.errorHandlingSrv, def.names.errorFnName, (req) => {
            const [err, _] = req.args;
            setTimeout(() => {
                reject(err);
            }, 0);
            return {
                retCode: ResultCodes.success,
                result: {},
            };
        });

        peer.internals.initiateParticle(particle, (stage) => {
            // If function is void, then it's completed when one of the two conditions is met:
            //  1. The particle is sent to the network (state 'sent')
            //  2. All CallRequests are executed, e.g., all variable loading and local function calls are completed (state 'localWorkDone')
            if (def.returnType.tag === 'void' && (stage.stage === 'sent' || stage.stage === 'localWorkDone')) {
                resolve(undefined);
            }

            if (stage.stage === 'sendingError') {
                reject(`Could not send particle for ${def.functionName}: not connected  (particle id: ${particle.id})`);
            }

            if (stage.stage === 'expired') {
                reject(`Request timed out after ${particle.ttl} for ${def.functionName} (particle id: ${particle.id})`);
            }

            if (stage.stage === 'interpreterError') {
                reject(
                    `Script interpretation failed for ${def.functionName}: ${stage.errorMessage}  (particle id: ${particle.id})`,
                );
            }
        });
    });

    return promise;
}

/**
 * Convenience function to support Aqua `service` generation backend
 * The compiler only need to generate a call the function and provide the corresponding definitions and the air script
 *
 * @param args - raw arguments passed by user to the generated function
 * @param def - service definition generated by the Aqua compiler
 */
export function registerService(args: any[], def: ServiceDef) {
    const { peer, service, serviceId } = extractRegisterServiceArgs(args, def.defaultServiceId);

    if (!peer.getStatus().isInitialized) {
        throw new Error(
            'Could not register the service because the peer is not initialized. Are you passing the wrong peer to the register function?',
        );
    }

    // Checking for missing keys
    const requiredKeys = def.functions.map((x) => x.functionName);
    const incorrectServiceDefinitions = requiredKeys.filter((f) => !(f in service));
    if (!!incorrectServiceDefinitions.length) {
        throw new Error(
            `Error registering service ${serviceId}: missing functions: ` +
                incorrectServiceDefinitions.map((d) => "'" + d + "'").join(', '),
        );
    }

    for (let singleFunction of def.functions) {
        // The function has type of (arg1, arg2, arg3, ... , callParams) => CallServiceResultType | void
        // Account for the fact that user service might be defined as a class - .bind(...)
        const userDefinedHandler = service[singleFunction.functionName].bind(service);

        peer.internals.regHandler.common(serviceId, singleFunction.functionName, async (req) => {
            const args = convertArgsFromReqToUserCall(req, singleFunction.argDefs);
            const rawResult = await userDefinedHandler.apply(null, args);
            const result = match(singleFunction.returnType)
                .with({ tag: 'primitive' }, () => rawResult)
                .with({ tag: 'optional' }, () => tsToAquaOpt(rawResult))
                .with({ tag: 'void' }, () => ({}))
                .exhaustive();

            return {
                retCode: ResultCodes.success,
                result: result,
            };
        });
    }
}

/**
 * Converts argument from ts representation (value | null) to air representation ([value] | [])
 */
const tsToAquaOpt = (arg: unknown | null): any => {
    return arg === null || arg === undefined ? [] : [arg];
};

/**
 * Converts argument from air representation ([value] | []) to ts representation (value | null)
 */
const aquaOptToTs = (opt: Array<unknown>) => {
    return opt.length === 0 ? null : opt[0];
};

/**
 * Converts raw arguments which may contain optional types from air representation to ts representation
 */
const convertArgsFromReqToUserCall = (req: CallServiceData, argDefs: Array<ArgDef<OptionalType | PrimitiveType>>) => {
    if (req.args.length !== argDefs.length) {
        throwForReq(req, `incorrect number of arguments, expected ${argDefs.length}`);
    }

    const argsAccountedForOptional = req.args.map((x, index) => {
        return match(argDefs[index].argType)
            .with({ tag: 'optional' }, () => aquaOptToTs(x))
            .with({ tag: 'primitive' }, () => x)
            .exhaustive();
    });

    return [...argsAccountedForOptional, extractCallParams(req, argDefs)];
};

/**
 * Extracts Call Params from CallServiceData and forms tetraplets according to generated function definition
 */
const extractCallParams = (
    req: CallServiceData,
    argDefs: Array<ArgDef<OptionalType | PrimitiveType>>,
): CallParams<any> => {
    let tetraplets: { [key in string]: SecurityTetraplet[] } = {};
    for (let i = 0; i < req.args.length; i++) {
        if (argDefs[i]) {
            tetraplets[argDefs[i].name] = req.tetraplets[i];
        }
    }

    const callParams = {
        ...req.particleContext,
        tetraplets,
    };

    return callParams;
};

/**
 * Arguments could be passed in one these configurations:
 * [...actualArgs]
 * [peer, ...actualArgs]
 * [...actualArgs, config]
 * [peer, ...actualArgs, config]
 *
 * This function select the appropriate configuration and returns
 * arguments in a structured way of: { peer, config, args }
 */
const extractFunctionArgs = (
    args: any[],
    numberOfExpectedArgs: number,
): {
    peer: FluencePeer;
    config?: FnConfig;
    args: any[];
} => {
    let peer: FluencePeer;
    let structuredArgs: any[];
    let config: any;
    if (FluencePeer.isInstance(args[0])) {
        peer = args[0];
        structuredArgs = args.slice(1, numberOfExpectedArgs + 1);
        config = args[numberOfExpectedArgs + 1];
    } else {
        peer = Fluence.getPeer();
        structuredArgs = args.slice(0, numberOfExpectedArgs);
        config = args[numberOfExpectedArgs];
    }

    return {
        peer: peer,
        config: config,
        args: structuredArgs,
    };
};

/**
 * Arguments could be passed in one these configurations:
 * [serviceObject]
 * [peer, serviceObject]
 * [defaultId, serviceObject]
 * [peer, defaultId, serviceObject]
 *
 * Where serviceObject is the raw object with function definitions passed by user
 *
 * This function select the appropriate configuration and returns
 * arguments in a structured way of: { peer, serviceId, service }
 */
const extractRegisterServiceArgs = (
    args: any[],
    defaultServiceId?: string,
): { peer: FluencePeer; serviceId: string; service: any } => {
    let peer: FluencePeer;
    let serviceId: any;
    let service: any;
    if (FluencePeer.isInstance(args[0])) {
        peer = args[0];
    } else {
        peer = Fluence.getPeer();
    }

    if (typeof args[0] === 'string') {
        serviceId = args[0];
    } else if (typeof args[1] === 'string') {
        serviceId = args[1];
    } else {
        serviceId = defaultServiceId;
    }

    // Figuring out which overload is the service.
    // If the first argument is not Fluence Peer and it is an object, then it can only be the service def
    // If the first argument is peer, we are checking further. The second argument might either be
    // an object, that it must be the service object
    // or a string, which is the service id. In that case the service is the third argument
    if (!FluencePeer.isInstance(args[0]) && typeof args[0] === 'object') {
        service = args[0];
    } else if (typeof args[1] === 'object') {
        service = args[1];
    } else {
        service = args[2];
    }

    return {
        peer: peer,
        serviceId: serviceId,
        service: service,
    };
};

function throwForReq(req: CallServiceData, message: string) {
    throw new Error(`${message}, serviceId='${req.serviceId}' fnName='${req.fnName}' args='${req.args}'`);
}

export const forTests = {
    extractFunctionArgs,
};
