import { SecurityTetraplet } from '@fluencelabs/avm';
import { match } from 'ts-pattern';

import { Particle } from '../../Particle';
import { CallParams, CallServiceData, GenericCallServiceHandler, ResultCodes } from '../../commonTypes';
import { FluencePeer } from '../../FluencePeer';

import { aquaArgs2Ts, responseServiceValue2ts, returnType2Aqua, ts2aqua } from './conversions';
import { ArrowWithoutCallbacks, FunctionCallConstants, FunctionCallDef, NonArrowType } from './interface';

export interface ServiceDescription {
    serviceId: string;
    fnName: string;
    handler: GenericCallServiceHandler;
}

/**
 * Creates a service which injects relay's peer id into aqua space
 */
export const injectRelayService = (def: FunctionCallDef, peer: FluencePeer) => {
    return {
        serviceId: def.names.getDataSrv,
        fnName: def.names.relay,
        handler: () => {
            return {
                retCode: ResultCodes.success,
                result: peer.getStatus().relayPeerId,
            };
        },
    };
};

/**
 * Creates a service which injects plain value into aqua space
 */
export const injectValueService = (serviceId: string, fnName: string, valueType: NonArrowType, value: any) => {
    return {
        serviceId: serviceId,
        fnName: fnName,
        handler: () => {
            return {
                retCode: ResultCodes.success,
                result: ts2aqua(value, valueType),
            };
        },
    };
};

/**
 *  Creates a service which is used to return value from aqua function into typescript space
 */
export const responseService = (def: FunctionCallDef, resolveCallback: Function) => {
    return {
        serviceId: def.names.responseSrv,
        fnName: def.names.responseFnName,
        handler: (req: CallServiceData) => {
            const userFunctionReturn = responseServiceValue2ts(req, def.arrow);

            setTimeout(() => {
                resolveCallback(userFunctionReturn);
            }, 0);

            return {
                retCode: ResultCodes.success,
                result: {},
            };
        },
    };
};

/**
 * Creates a service which is used to return errors from aqua function into typescript space
 */
export const errorHandlingService = (def: FunctionCallDef, rejectCallback: Function) => {
    return {
        serviceId: def.names.errorHandlingSrv,
        fnName: def.names.errorFnName,
        handler: (req: CallServiceData) => {
            const [err, _] = req.args;
            setTimeout(() => {
                rejectCallback(err);
            }, 0);
            return {
                retCode: ResultCodes.success,
                result: {},
            };
        },
    };
};

/**
 * Creates a service for user-defined service function handler
 */
export const userHandlerService = (
    serviceId: string,
    arrowType: [string, ArrowWithoutCallbacks],
    userHandler: (...args: Array<unknown>) => Promise<unknown>,
) => {
    const [fnName, type] = arrowType;
    return {
        serviceId,
        fnName,
        handler: async (req: CallServiceData) => {
            const args = [...aquaArgs2Ts(req, type), extractCallParams(req, type)];
            const rawResult = await userHandler.apply(null, args);
            const result = returnType2Aqua(rawResult, type);

            return {
                retCode: ResultCodes.success,
                result: result,
            };
        },
    };
};

/**
 * Converts argument of aqua function to a corresponding service.
 * For arguments of non-arrow types the resulting service injects the argument into aqua space.
 * For arguments of arrow types the resulting service calls the corresponding function.
 */
export const argToServiceDef = (
    arg: any,
    argName: string,
    argType: NonArrowType | ArrowWithoutCallbacks,
    names: FunctionCallConstants,
): ServiceDescription => {
    if (argType.tag === 'arrow') {
        return userHandlerService(names.callbackSrv, [argName, argType], arg);
    } else {
        return injectValueService(names.getDataSrv, argName, arg, argType);
    }
};

/**
 * Extracts call params from from call service data according to aqua type definition
 */
const extractCallParams = (req: CallServiceData, arrow: ArrowWithoutCallbacks): CallParams<any> => {
    const names = match(arrow.domain)
        .with({ tag: 'nil' }, () => {
            return [] as string[];
        })
        .with({ tag: 'labeledProduct' }, (x) => {
            return Object.keys(x.fields);
        })
        .with({ tag: 'unlabeledProduct' }, (x) => {
            return x.items.map((_, index) => 'arg' + index);
        })
        .exhaustive();

    const tetraplets: Record<string, SecurityTetraplet[]> = {};
    for (let i = 0; i < req.args.length; i++) {
        if (names[i]) {
            tetraplets[names[i]] = req.tetraplets[i];
        }
    }

    const callParams = {
        ...req.particleContext,
        tetraplets,
    };

    return callParams;
};

export const registerParticleScopeService = (peer: FluencePeer, particle: Particle, service: ServiceDescription) => {
    peer.internals.regHandler.forParticle(particle.id, service.serviceId, service.fnName, service.handler);
};

export const registerGlobalService = (peer: FluencePeer, service: ServiceDescription) => {
    peer.internals.regHandler.common(service.serviceId, service.fnName, service.handler);
};
