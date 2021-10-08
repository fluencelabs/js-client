import { Fluence, FluencePeer } from 'src';
import { CallServiceResultType } from '../../internal/CallServiceHandler';
import { CallServiceHandler } from '../../internal/CallServiceHandler2';
import { Particle } from '../particle';

export { FluencePeer } from '../FluencePeer';
export { ResultCodes } from '../../internal/CallServiceHandler';
export { CallParams } from '../commonTypes';

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

export function makeFnCall(peer: FluencePeer, script, args: Arg[]) {}

export function makeServiceReg() {}
