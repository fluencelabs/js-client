import { FluencePeer } from '../index';
import { Particle } from '../internal/particle';
import { MakeServiceCall } from '../internal/utils';

export const registerHandlersHelper = (peer: FluencePeer, particle: Particle, handlers) => {
    const { _timeout, ...rest } = handlers;
    if (_timeout) {
        peer.internals.regHandler.timeout(particle.id, _timeout);
    }
    for (let serviceId in rest) {
        for (let fnName in rest[serviceId]) {
            // of type [args] => result
            const h = rest[serviceId][fnName];
            peer.internals.regHandler.forParticle(particle.id, serviceId, fnName, MakeServiceCall(h));
        }
    }
};
