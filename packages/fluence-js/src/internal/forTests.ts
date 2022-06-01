import { FluencePeer } from './FluencePeer';
import { MakeServiceCall } from './utils';

export type { CallServiceData } from './commonTypes';
export { Sig, defaultSigGuard, allowServiceFn } from './builtins/Sig';
export { handleTimeout, MakeServiceCall, checkConnection, doNothing } from './utils';

export const registerHandlersHelper = (
    peer: FluencePeer,
    particle: any,
    handlers: Record<string, Record<string, any>>,
) => {
    Object.entries(handlers).forEach(([serviceId, service]) => {
        Object.entries(service).forEach(([fnName, fn]) => {
            peer.internals.regHandler.forParticle(particle.id, serviceId, fnName, MakeServiceCall(fn));
        });
    });
};
