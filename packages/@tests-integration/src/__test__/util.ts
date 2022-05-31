import { FluencePeer } from '@fluencelabs/fluence';

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

export const MakeServiceCall =
    (fn: (args: any[]) => any) =>
    (req: any): any => ({
        retCode: 0,
        result: fn(req.args),
    });
