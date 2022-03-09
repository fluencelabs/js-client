import { FluencePeer } from '../../FluencePeer';
import { Fluence } from '../../../index';
import { ServiceDef } from './interface';
import { registerGlobalService, userHandlerService } from './misc';

/**
 * Convenience function to support Aqua `service` generation backend
 * The compiler only need to generate a call the function and provide the corresponding definitions and the air script
 *
 * @param args - raw arguments passed by user to the generated function
 * @param def - service definition generated by the Aqua compiler
 */
export function registerService(args: any[], def: ServiceDef) {
    const { peer, service, serviceId } = extractArgs(args, def.defaultServiceId);

    if (!peer.getStatus().isInitialized) {
        throw new Error(
            'Could not register the service because the peer is not initialized. Are you passing the wrong peer to the register function?',
        );
    }

    // Checking for missing keys
    const requiredKeys = def.functions.fields.map(([key, type]) => key);
    const incorrectServiceDefinitions = requiredKeys.filter((f) => !(f in service));
    if (!!incorrectServiceDefinitions.length) {
        throw new Error(
            `Error registering service ${serviceId}: missing functions: ` +
                incorrectServiceDefinitions.map((d) => "'" + d + "'").join(', '),
        );
    }

    for (let singleFunction of def.functions.fields) {
        let [name, type] = singleFunction;
        // The function has type of (arg1, arg2, arg3, ... , callParams) => CallServiceResultType | void
        // Account for the fact that user service might be defined as a class - .bind(...)
        const userDefinedHandler = service[name].bind(service);

        const serviceDescription = userHandlerService(serviceId, singleFunction, userDefinedHandler);
        registerGlobalService(peer, serviceDescription);
    }
}

/**
 * Arguments could be passed in one these configurations:
 * [serviceObject]
 * [peer, serviceObject]
 * [defaultId, serviceObject]
 * [peer, defaultId, serviceObject]
 *
 * Where serviceObject is the raw object with function definitions passed by user
 *
 * This function select the appropriate configuration and returns
 * arguments in a structured way of: { peer, serviceId, service }
 */
const extractArgs = (
    args: any[],
    defaultServiceId?: string,
): { peer: FluencePeer; serviceId: string; service: any } => {
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
        serviceId = defaultServiceId;
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
