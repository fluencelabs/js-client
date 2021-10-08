import { Fluence, FluencePeer } from 'src';
import { CallServiceResultType } from '../../internal/CallServiceHandler';
import { CallServiceHandler } from '../../internal/CallServiceHandler2';
import { Particle } from '../particle';

export { FluencePeer } from '../FluencePeer';
export { ResultCodes } from '../../internal/CallServiceHandler';
export { CallParams } from '../commonTypes';

function missingFields(obj: any, fields: string[]): string[] {
    return fields.filter((f) => !(f in obj));
}

export const extractFunctionArgs = (
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

export const extractServiceArgs = (args: any[]): { peer: FluencePeer; serviceId: string; service: any } => {
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
        serviceId = 'cid';
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

export function registerParticleSpecificHandler(
    peer: FluencePeer,
    particleId: string,
    serviceId: string,
    fnName: string,
    handler: (args: any[], callParams) => CallServiceResultType,
) {}

export function handleTimeout(peer: FluencePeer, particleId: string, timeoutHandler: () => void) {}

export function registerHandler(
    peer: FluencePeer,
    serviceId: string,
    fnName: string,
    handler: (args: any[], callParams) => CallServiceResultType,
) {}

interface Arg {
    name: string;
    isOptional: boolean;
}

export function callFunction(data: {
    functionName: string;
    rawFnArgs: any[];
    script: string;
    args: Arg[];
    functions: any[];
    names: {
        relay: string;
        getDataSrv: string;
        callbackService: string;
        response: string;
        errorHandlingSrv: string;
        error: string;
    };
}) {
    const { args, peer, config } = extractFunctionArgs(data.rawFnArgs, data.args.length);

    return new Promise((resolve, reject) => {
        const particle = Particle.createNew(data.script, config?.ttl);

        for (let i = 0; i < data.args.length; i++) {
            const arg = data.args[i];
            registerParticleSpecificHandler(peer, particle.id, data.names.getDataSrv, arg.name, () => {
                if (arg.isOptional) {
                    // TODO: convert to array and so on
                } else {
                    return args[i];
                }
            });
        }

        registerParticleSpecificHandler(peer, particle.id, data.names.callbackService, data.names.response, (args) => {
            const [res] = args;
            setTimeout(() => {
                resolve(res);
            }, 0);
            return {};
        });

        registerParticleSpecificHandler(peer, particle.id, data.names.errorHandlingSrv, data.names.error, (args) => {
            const [err] = args;
            setTimeout(() => {
                resolve(err);
            }, 0);
            return {};
        });

        handleTimeout(peer, particle.id, () => {
            reject(`Request timed out for ${data.functionName}`);
        });

        peer.internals.newMethodToStartParticles(particle);
    });
}

export function regService(data: { rawFnArgs: any[] }) {
    const { peer, service, serviceId } = extractServiceArgs(data.rawFnArgs);

    const incorrectServiceDefinitions = missingFields(service, Object.keys(service));
    if (!!incorrectServiceDefinitions.length) {
        throw new Error(
            'Error registering service SomeS: missing functions: ' +
                incorrectServiceDefinitions.map((d) => "'" + d + "'").join(', '),
        );
    }

    for (let name in service) {
        registerHandler(peer, serviceId, name, service[name]);
    }
}
