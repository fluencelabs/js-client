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

import { SecurityTetraplet } from '@fluencelabs/avm';
import { match } from 'ts-pattern';
import { CallParams, Fluence, FluencePeer } from '../../index';
import { CallServiceData, GenericCallServiceHandler, CallServiceResult, ResultCodes } from '../commonTypes';
import { Particle } from '../Particle';

export { FluencePeer } from '../FluencePeer';
export { CallParams } from '../commonTypes';

type OptionalType = {
    tag: 'optional';
};

type VoidType = {
    tag: 'void';
};

type PrimitiveType = {
    tag: 'primitive';
};

type CallbackType = {
    tag: 'callback';
    callback: {
        argDefs: Array<ArgDef<OptionalType | PrimitiveType>>;
        returnType: VoidType | OptionalType | PrimitiveType;
    };
};

type MultiReturnType = {
    tag: 'multiReturn';
    returnItems: Array<OptionalType | PrimitiveType>;
};

interface ArgDef<ArgType> {
    name: string;
    argType: ArgType;
}

interface CallbackDef<ArgType, ReturnType> {
    argDefs: Array<ArgDef<ArgType>>;
    returnType: ReturnType;
}

interface FunctionBodyDef
    extends CallbackDef<
        // force new line
        OptionalType | PrimitiveType,
        VoidType | OptionalType | PrimitiveType
    > {
    functionName: string;
}

interface FunctionCallDef
    extends CallbackDef<
        OptionalType | PrimitiveType | CallbackType,
        VoidType | OptionalType | PrimitiveType | MultiReturnType
    > {
    functionName: string;
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

const tsToAquaOpt = (arg: unknown | null): any => {
    return arg === null || arg === undefined ? [] : [arg];
};

const aquaOptToTs = (opt: Array<unknown>) => {
    return opt.length === 0 ? null : opt[0];
};

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
                .with({ tag: 'callback' }, (callbackDef) => {
                    const fn = async (req: CallServiceData): Promise<CallServiceResult> => {
                        const args = convertArgsFromReqToUserCall(req, callbackDef.callback.argDefs);
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
                .with({ tag: 'optional' }, () => {
                    const fn = (req: CallServiceData): CallServiceResult => {
                        const res = tsToAquaOpt(arg);
                        return {
                            retCode: ResultCodes.success,
                            result: res,
                        };
                    };
                    return [def.names.getDataSrv, argDef.name, fn] as const;
                })
                .with({ tag: 'primitive' }, () => {
                    const fn = (req: CallServiceData): CallServiceResult => ({
                        retCode: ResultCodes.success,
                        result: arg,
                    });
                    return [def.names.getDataSrv, argDef.name, fn] as const;
                })
                .exhaustive();

            peer.internals.regHandler.forParticle(particle.id, serviceId, fnName, cb);
        }

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

        peer.internals.regHandler.forParticle(particle.id, def.names.getDataSrv, def.names.relay, (req) => {
            return {
                retCode: ResultCodes.success,
                result: peer.getStatus().relayPeerId,
            };
        });

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

        peer.internals.regHandler.timeout(particle.id, () => {
            reject(`Request timed out for ${def.functionName}`);
        });

        peer.internals.initiateParticle(particle);
    });

    if (def.returnType.tag === 'void') {
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
        // The function has type of (arg1, arg2, arg3, ... , callParams) => CallServiceResultType | void
        const userDefinedHandler = service[singleFunction.functionName];

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

function throwForReq(req: CallServiceData, message: string) {
    throw new Error(`${message}, serviceId='${req.serviceId}' fnName='${req.fnName}' args='${req.args}'`);
}
