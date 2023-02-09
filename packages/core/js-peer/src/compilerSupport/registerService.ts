import type { IFluenceClient, ServiceDef } from '@fluencelabs/interface';
import { registerGlobalService, userHandlerService } from './services.js';

export const registerServiceImpl = (
    peer: IFluenceClient,
    def: ServiceDef,
    serviceId: string | undefined,
    service: any,
) => {
    // TODO: TBH service registration is just putting some stuff into a hashmap
    // there should not be such a check at all
    if (!peer.getStatus().isInitialized) {
        throw new Error(
            'Could not register the service because the peer is not initialized. Are you passing the wrong peer to the register function?',
        );
    }

    // Checking for missing keys
    const requiredKeys = def.functions.tag === 'nil' ? [] : Object.keys(def.functions.fields);
    const incorrectServiceDefinitions = requiredKeys.filter((f) => !(f in service));
    if (!!incorrectServiceDefinitions.length) {
        throw new Error(
            `Error registering service ${serviceId}: missing functions: ` +
                incorrectServiceDefinitions.map((d) => "'" + d + "'").join(', '),
        );
    }

    if (!serviceId) {
        serviceId = def.defaultServiceId;
    }

    if (!serviceId) {
        throw new Error('Service ID must be specified');
    }

    const singleFunctions = def.functions.tag === 'nil' ? [] : Object.entries(def.functions.fields);
    for (let singleFunction of singleFunctions) {
        let [name, type] = singleFunction;
        // The function has type of (arg1, arg2, arg3, ... , callParams) => CallServiceResultType | void
        // Account for the fact that user service might be defined as a class - .bind(...)
        const userDefinedHandler = service[name].bind(service);

        const serviceDescription = userHandlerService(serviceId, singleFunction, userDefinedHandler);
        registerGlobalService(peer, serviceDescription);
    }
};
