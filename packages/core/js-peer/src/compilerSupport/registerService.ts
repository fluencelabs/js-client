import type { RegisterService } from '@fluencelabs/interfaces';
import { registerGlobalService, userHandlerService } from './services.js';

export const registerService: RegisterService = ({ peer, def, serviceId, service }) => {
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
