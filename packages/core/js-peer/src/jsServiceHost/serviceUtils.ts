import { IParticle } from '../particle/interfaces.js';
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
