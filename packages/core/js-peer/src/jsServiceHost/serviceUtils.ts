import { FluencePeer } from '../jsPeer/FluencePeer.js';
import { IParticle } from '../particle/interfaces.js';
import { builtInServices } from '../services/builtins.js';
import {
    CallServiceData,
    CallServiceResult,
    CallServiceResultType,
    ParticleContext,
    ResultCodes,
} from './interfaces.js';

export const doNothing = (..._args: Array<unknown>) => undefined;

export const WrapFnIntoServiceCall =
    (fn: (args: any[]) => CallServiceResultType) =>
    (req: CallServiceData): CallServiceResult => ({
        retCode: ResultCodes.success,
        result: fn(req.args),
    });

export class ServiceError extends Error {
    constructor(message: string) {
        super(message);

        Object.setPrototypeOf(this, ServiceError.prototype);
    }
}

export const getParticleContext = (particle: IParticle): ParticleContext => {
    return {
        particleId: particle.id,
        initPeerId: particle.initPeerId,
        timestamp: particle.timestamp,
        ttl: particle.ttl,
        signature: particle.signature,
    };
};

export function registerDefaultServices(peer: FluencePeer) {
    Object.entries(builtInServices).forEach(([serviceId, service]) => {
        Object.entries(service).forEach(([fnName, fn]) => {
            peer.internals.regHandler.common(serviceId, fnName, fn);
        });
    });
}
