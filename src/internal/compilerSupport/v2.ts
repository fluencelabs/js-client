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

import { CallParams, Fluence, FluencePeer } from '../../index';
import { CallServiceData, GenericCallServiceHandler, ResultCodes } from '../CallServiceHandler';
import { Particle } from '../particle';

export { FluencePeer } from '../FluencePeer';
export { CallParams } from '../commonTypes';

interface ArgDef {
    name: string;
    isOptional: boolean;
    callbackDef?: CallbackDef;
}

interface ReturnTypeDef {
    isVoid: boolean;
    isOptional: boolean;
    multiReturn?: Array<{ isOptional: boolean }>;
}

interface CallbackDef {
    argDefs: Array<ArgDef>;
    returnType: ReturnTypeDef;
}

interface FunctionBodyDef extends CallbackDef {
    functionName: string;
}

interface FunctionCallDef extends FunctionBodyDef {
    names: {
        relay: string;
        getDataSrv: string;
        callbackSrv: string;
        responseSrv: string;
        responseFnName: string;
        errorHandlingSrv: string;
        errorFnName: string;
    };
}

interface ServiceDef {
    defaultServiceId?: string;
    functions: Array<FunctionBodyDef>;
}

const tsToAquaOpt = (arg: unknown | null) => {
    return arg === null || arg === undefined ? [] : [arg];
};

const aquaOptToTs = (opt: Array<unknown>) => {
    return opt.length === 0 ? null : opt[0];
};

const returnArg = (arg: any, returnType: ReturnTypeDef) => {
    if (returnType.multiReturn) {
        return returnType.multiReturn.map((x, index) => {
            if (x.isOptional) {
                return aquaOptToTs(arg[index]);
            } else {
                return arg[index];
            }
        });
    }

    if (returnType.isVoid) {
        return {};
    }

    if (returnType.isOptional) {
        return tsToAquaOpt(arg);
    }

    return arg;
};

export function callFunction(rawFnArgs: Array<any>, def: FunctionCallDef, script: string) {
    const { args, peer, config } = extractFunctionArgs(rawFnArgs, def.argDefs.length);

    const promise = new Promise((resolve, reject) => {
        const particle = Particle.createNew(script, config?.ttl);

        for (let i = 0; i < def.argDefs.length; i++) {
            const argDef = def.argDefs[i];
            const arg = args[i];

            if (argDef.callbackDef) {
                registerParticleSpecificHandler(peer, particle.id, def.names.callbackSrv, argDef.name, async (req) => {
                    const args = convertArgsFromReqToUserCall(req, argDef.callbackDef.argDefs);
                    const result = await arg.apply(null, args);
                    return {
                        retCode: ResultCodes.success,
                        result: returnArg(result, argDef.callbackDef.returnType),
                    };
                });
            } else if (argDef.isOptional) {
                registerParticleSpecificHandler(peer, particle.id, def.names.getDataSrv, argDef.name, (req) => {
                    const res = tsToAquaOpt(arg);
                    return {
                        retCode: ResultCodes.success,
                        result: res,
                    };
                });
            } else {
                registerParticleSpecificHandler(peer, particle.id, def.names.getDataSrv, argDef.name, (req) => {
                    return {
                        retCode: ResultCodes.success,
                        result: arg,
                    };
                });
            }
        }

        registerParticleSpecificHandler(peer, particle.id, def.names.responseSrv, def.names.responseFnName, (req) => {
            let res;
            if (def.returnType.multiReturn) {
                res = def.returnType.multiReturn.map((x, index) => {
                    if (x.isOptional) {
                        return aquaOptToTs(req.args[index]);
                    } else {
                        return req.args[index];
                    }
                });
            } else if (def.returnType.isOptional) {
                res = aquaOptToTs(req.args[0]);
            } else {
                res = req.args[0];
            }

            setTimeout(() => {
                resolve(res);
            }, 0);
            return {
                retCode: ResultCodes.success,
                result: {},
            };
        });

        registerParticleSpecificHandler(peer, particle.id, def.names.getDataSrv, def.names.relay, (req) => {
            return {
                retCode: ResultCodes.success,
                result: peer.getStatus().relayPeerId,
            };
        });

        registerParticleSpecificHandler(peer, particle.id, def.names.errorHandlingSrv, def.names.errorFnName, (req) => {
            const [err, whatNumber] = req.args;
            setTimeout(() => {
                reject(err);
            }, 0);
            return {
                retCode: ResultCodes.success,
                result: {},
            };
        });

        handleTimeout(peer, particle.id, () => {
            reject(`Request timed out for ${def.functionName}`);
        });

        peer.internals.initiateParticle(particle);
    });

    if (def.returnType.isVoid) {
        return Promise.resolve([promise]);
    } else {
        return promise;
    }
}

export function registerService(args: any[], def: ServiceDef) {
    const { peer, service, serviceId } = extractRegisterServiceArgs(args, def.defaultServiceId);

    const incorrectServiceDefinitions = missingFields(service, Object.keys(service));
    if (!!incorrectServiceDefinitions.length) {
        throw new Error(
            `Error registering service ${serviceId}: missing functions: ` +
                incorrectServiceDefinitions.map((d) => "'" + d + "'").join(', '),
        );
    }

    for (let singleFunction of def.functions) {
        // has type of (arg1, arg2, arg3, ... , callParams) => CallServiceResultType | void
        const userDefinedHandler = service[singleFunction.functionName];

        registerCommonHandler(peer, serviceId, singleFunction.functionName, async (req) => {
            const args = convertArgsFromReqToUserCall(req, singleFunction.argDefs);
            const result = await userDefinedHandler.apply(null, args);
            return {
                retCode: ResultCodes.success,
                result: returnArg(result, singleFunction.returnType),
            };
        });
    }
}

const convertArgsFromReqToUserCall = (req: CallServiceData, args: Array<ArgDef>) => {
    const argsAccountedForOptional = req.args.map((x, index) => {
        if (args[index].isOptional) {
            return aquaOptToTs(x);
        } else {
            return x;
        }
    });

    return [...argsAccountedForOptional, extractCallParams(req, args)];
};

const extractCallParams = (req: CallServiceData, args: Array<ArgDef>): CallParams<any> => {
    let tetraplets: any = {};
    for (let i = 0; i < req.args.length; i++) {
        if (args[i]) {
            tetraplets[args[i].name] = req.tetraplets[i];
        }
    }

    const callParams = {
        ...req.particleContext,
        tetraplets: {
            tetraplets,
        },
    };

    return callParams;
};

const missingFields = (obj: any, fields: string[]): string[] => {
    return fields.filter((f) => !(f in obj));
};

const extractFunctionArgs = (
    args: any[],
    numberOfExpectedArgs: number,
): {
    peer: FluencePeer;
    config?: { ttl?: number };
    args: any[];
} => {
    let peer: FluencePeer;
    let structuredArgs: any[];
    let config: any;
    if (FluencePeer.isInstance(args[0])) {
        peer = args[0];
        structuredArgs = args.slice(1, numberOfExpectedArgs + 1);
        config = args[numberOfExpectedArgs + 2];
    } else {
        peer = Fluence.getPeer();
        structuredArgs = args.slice(0, numberOfExpectedArgs);
        config = args[numberOfExpectedArgs + 1];
    }

    return {
        peer: peer,
        config: config,
        args: structuredArgs,
    };
};

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

function registerParticleSpecificHandler(
    peer: FluencePeer,
    particleId: string,
    serviceId: string,
    fnName: string,
    handler: GenericCallServiceHandler,
) {
    peer.internals.regHandler.forParticle(particleId, serviceId, fnName, handler);
}

function handleTimeout(peer: FluencePeer, particleId: string, timeoutHandler: () => void) {
    peer.internals.regHandler.timeout(particleId, timeoutHandler);
}

function registerCommonHandler(
    peer: FluencePeer,
    serviceId: string,
    fnName: string,
    handler: GenericCallServiceHandler,
) {
    peer.internals.regHandler.common(serviceId, fnName, handler);
}
