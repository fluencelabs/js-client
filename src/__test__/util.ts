import { FluencePeer } from '../index';
import { Particle } from '../internal/Particle';
import { MakeServiceCall } from '../internal/utils';

export const registerHandlersHelper = (peer: FluencePeer, particle: Particle, handlers) => {
    for (const serviceId in handlers) {
        for (const fnName in handlers[serviceId]) {
            // of type [args] => result
            const h = handlers[serviceId][fnName];
            peer.internals.regHandler.forParticle(particle.id, serviceId, fnName, MakeServiceCall(h));
        }
    }
};
