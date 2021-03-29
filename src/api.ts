import { SecurityTetraplet } from './internal/commonTypes';
import { RequestFlowBuilder } from './internal/RequestFlowBuilder';
import { FluenceClient } from './FluenceClient';

/**
 * The class representing Particle - a data structure used to perform operations on Fluence Network. It originates on some peer in the network, travels the network through a predefined path, triggering function execution along its way.
 */
export class Particle {
    script: string;
    data: Map<string, any>;
    ttl: number;

    /**
     * Creates a particle with specified parameters.
     * @param { String }script - Air script which defines the execution of a particle – its path, functions it triggers on peers, and so on.
     * @param { Map<string, any> | Record<string, any> } data - Variables passed to the particle in the form of either JS Map or JS object with keys representing variable names and values representing values correspondingly
     * @param { [Number]=7000 } ttl - Time to live, a timout after which the particle execution is stopped by Aquamarine.
     */
    constructor(script: string, data?: Map<string, any> | Record<string, any>, ttl?: number) {
        this.script = script;
        if (data === undefined) {
            this.data = new Map();
        } else if (data instanceof Map) {
            this.data = data;
        } else {
            this.data = new Map();
            for (let k in data) {
                this.data.set(k, data[k]);
            }
        }

        this.ttl = ttl ?? 7000;
    }
}

/**
 * Send a particle to Fluence Network using the specified Fluence Client.
 * @param { FluenceClient } client - The Fluence Client instance.
 * @param { Particle } particle  - The particle to send.
 */
export const sendParticle = async (
    client: FluenceClient,
    particle: Particle,
    onError?: (err) => void,
): Promise<string> => {
    const [req, errorPromise] = new RequestFlowBuilder()
        .withDefaults()
        .withRawScript(particle.script)
        .withVariables(particle.data)
        .withTTL(particle.ttl)
        .buildWithErrorHandling();

    errorPromise.catch(onError);

    await client.initiateFlow(req);
    return req.id;
};

/*
    This map stores functions which unregister callbacks registered by registerServiceFunction
    The key sould be created with makeKey. The value is the unresitration function
    This is only needed to support legacy api
*/
const handlersUnregistratorsMap = new Map();
const makeKey = (client: FluenceClient, serviceId: string, fnName: string) => {
    const pid = client.selfPeerId || '';
    return `${pid}/${serviceId}/${fnName}`;
};

/**
 * Registers a function which can be called on the client from Aquamarine. The registration is per client basis.
 * @param { FluenceClient } client - The Fluence Client instance.
 * @param { string } serviceId - The identifier of service which would be used to make calls from Aquamarine
 * @param { string } fnName - The identifier of function which would be used to make calls from Aquamarine
 * @param { (args: any[], tetraplets: SecurityTetraplet[][]) => object } handler - The handler which would be called by Aquamarine infrastructure. The result is any object passed back to Aquamarine
 */
export const registerServiceFunction = (
    client: FluenceClient,
    serviceId: string,
    fnName: string,
    handler: (args: any[], tetraplets: SecurityTetraplet[][]) => object,
) => {
    const unregister = client.aquaCallHandler.on(serviceId, fnName, handler);
    handlersUnregistratorsMap.set(makeKey(client, serviceId, fnName), unregister);
};

// prettier-ignore
/**
 * Removes registers for the function previously registered with {@link registerServiceFunction}
 * @param { FluenceClient } client - The Fluence Client instance.
 * @param { string } serviceId - The identifier of service used in {@link registerServiceFunction} call
 * @param { string } fnName - The identifier of function used in {@link registerServiceFunction} call
 */
export const unregisterServiceFunction = (
    client: FluenceClient,
    serviceId: string,
    fnName: string
) => {
    const key = makeKey(client, serviceId, fnName);
    const unuse = handlersUnregistratorsMap.get(key);
    if(unuse) {
        unuse();
    }
    handlersUnregistratorsMap.delete(key);
};

/**
 * Registers an event-like handler for all calls to the specific service\function pair from from Aquamarine. The registration is per client basis. Return a function which when called removes the subscription.
 * Same as registerServiceFunction which immediately returns empty object.
 * @param { FluenceClient } client - The Fluence Client instance.
 * @param { string } serviceId - The identifier of service calls to which from Aquamarine are transformed into events.
 * @param { string } fnName - The identifier of function calls to which from Aquamarine are transformed into events.
 * @param { (args: any[], tetraplets: SecurityTetraplet[][]) => object } handler - The handler which would be called by Aquamarine infrastructure
 * @returns { Function } - A function which when called removes the subscription.
 */
export const subscribeToEvent = (
    client: FluenceClient,
    serviceId: string,
    fnName: string,
    handler: (args: any[], tetraplets: SecurityTetraplet[][]) => void,
): Function => {
    const realHandler = (args: any[], tetraplets: SecurityTetraplet[][]) => {
        // dont' block
        setTimeout(() => {
            handler(args, tetraplets);
        }, 0);

        return {};
    };
    registerServiceFunction(client, serviceId, fnName, realHandler);
    return () => {
        unregisterServiceFunction(client, serviceId, fnName);
    };
};

/**
 * Send a particle with a fetch-like semantics. In order to for this to work you have to you have to make a call to the same callbackServiceId\callbackFnName pair from Air script as specified by the parameters. The arguments of the call are returned as the resolve value of promise
 * @param { FluenceClient } client - The Fluence Client instance.
 * @param { Particle } particle  - The particle to send.
 * @param { string } callbackFnName - The identifier of function which should be used in Air script to pass the data to fetch "promise"
 * @param { [string]='_callback' } callbackServiceId - The service identifier which should be used in Air script to pass the data to fetch "promise"
 * @returns { Promise<T> } - A promise which would be resolved with the data returned from Aquamarine
 */
export const sendParticleAsFetch = async <T>(
    client: FluenceClient,
    particle: Particle,
    callbackFnName: string,
    callbackServiceId: string = '_callback',
): Promise<T> => {
    const [request, promise] = new RequestFlowBuilder()
        .withDefaults()
        .withRawScript(particle.script)
        .withVariables(particle.data)
        .withTTL(particle.ttl)
        .buildAsFetch<T>(callbackServiceId, callbackFnName);

    await client.initiateFlow(request);

    return promise;
};
