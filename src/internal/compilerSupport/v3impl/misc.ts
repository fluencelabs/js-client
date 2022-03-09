import { Particle } from 'src/internal/Particle';
import { CallServiceData, CallServiceResult, GenericCallServiceHandler, ResultCodes } from '../../commonTypes';
import { FluencePeer } from '../v1';
import { aquaArgs2Ts, returnType2Aqua, ts2aqua } from './conversions';
import { ArrowWithoutCallbacks, FunctionCallConstants, FunctionCallDef, NonArrowType } from './interface';

export interface ServiceDescription {
    serviceId: string;
    fnName: string;
    handler: GenericCallServiceHandler;
}

export const injectRelayService = (def: FunctionCallDef, peer: FluencePeer) => {
    return {
        serviceId: def.names.getDataSrv,
        fnName: def.names.relay,
        handler: (req) => {
            return {
                retCode: ResultCodes.success,
                result: peer.getStatus().relayPeerId,
            };
        },
    };
};

export const responseService = (def: FunctionCallDef, resolve) => {
    return {
        serviceId: def.names.responseSrv,
        fnName: def.names.responseFnName,
        handler: (req) => {
            const userFunctionReturn = returnType2Aqua(req.args, def.arrow);

            setTimeout(() => {
                resolve(userFunctionReturn);
            }, 0);

            return {
                retCode: ResultCodes.success,
                result: {},
            };
        },
    };
};

export const errorHandlingService = (def: FunctionCallDef, reject) => {
    return {
        serviceId: def.names.errorHandlingSrv,
        fnName: def.names.errorFnName,
        handler: (req) => {
            const [err, _] = req.args;
            setTimeout(() => {
                reject(err);
            }, 0);
            return {
                retCode: ResultCodes.success,
                result: {},
            };
        },
    };
};

export const userHandlerService = (serviceId: string, arrowType: [string, ArrowWithoutCallbacks], userHandler) => {
    const [fnName, type] = arrowType;
    return {
        serviceId,
        fnName,
        handler: async (req) => {
            const args = aquaArgs2Ts(req.args, type);
            const rawResult = await userHandler.apply(null, args);
            const result = returnType2Aqua(rawResult, type);

            return {
                retCode: ResultCodes.success,
                result: result,
            };
        },
    };
};

export const argToServiceDef = (
    arg: any,
    argName: string,
    argType: NonArrowType | ArrowWithoutCallbacks,
    names: FunctionCallConstants,
): ServiceDescription => {
    let serviceId;
    let fnName = argName;
    let handler;
    if (argType.tag === 'arrow') {
        handler = async (req: CallServiceData): Promise<CallServiceResult> => {
            const args = aquaArgs2Ts(req.args, argType);
            // arg is function at this point
            const result = await arg.apply(null, args);
            return {
                retCode: ResultCodes.success,
                result: returnType2Aqua(result, argType),
            };
        };
        serviceId = names.callbackSrv;
    } else {
        handler = (req: CallServiceData): CallServiceResult => {
            const res = ts2aqua(arg, argType);
            return {
                retCode: ResultCodes.success,
                result: res,
            };
        };
        serviceId = names.getDataSrv;
    }

    return {
        serviceId,
        fnName,
        handler,
    };
};

export const registerParticleScopeService = (peer: FluencePeer, particle: Particle, service: ServiceDescription) => {
    peer.internals.regHandler.forParticle(particle.id, service.serviceId, service.fnName, service.handler);
};

export const registerGlobalService = (peer: FluencePeer, service: ServiceDescription) => {
    peer.internals.regHandler.common(service.serviceId, service.fnName, service.handler);
};
