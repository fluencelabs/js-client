import { FluencePeer } from '../index';
import { Particle } from '../internal/Particle';
import { MakeServiceCall } from '../internal/utils';

export const registerHandlersHelper = (peer: FluencePeer, particle: Particle, handlers) => {
    for (let serviceId in handlers) {
        for (let fnName in handlers[serviceId]) {
            // of type [args] => result
            const h = handlers[serviceId][fnName];
            peer.internals.regHandler.forParticle(particle.id, serviceId, fnName, MakeServiceCall(h));
        }
    }
};
