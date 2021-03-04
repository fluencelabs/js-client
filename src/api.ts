import Multiaddr from 'multiaddr';
import PeerId from 'peer-id';
import { PeerIdB58, SecurityTetraplet } from './internal/commonTypes';
import * as unstable from './api.unstable';
import { ClientImpl } from './internal/ClientImpl';
import { RequestFlowBuilder } from './internal/RequestFlowBuilder';
import { RequestFlow } from './internal/RequestFlow';

/**
 * The class represents interface to Fluence Platform. To create a client @see {@link createClient} function.
 */
export interface FluenceClient {
    /**
     * { string } Gets the base58 representation of the current peer id. Read only
     */
    readonly relayPeerId: PeerIdB58 | undefined;

    /**
     * { string } Gets the base58 representation of the connected relay's peer id. Read only
     */
    readonly selfPeerId: PeerIdB58;

    /**
     * { string } True if the client is connected to network. False otherwise. Read only
     */
    readonly isConnected: boolean;

    /**
     * Disconnects the client from the network
     */
    disconnect(): Promise<void>;

    /**
     * Establish a connection to the node. If the connection is already established, disconnect and reregister all services in a new connection.
     *
     * @param {string | Multiaddr} [multiaddr] - Address of the node in Fluence network.
     */
    connect(multiaddr: string | Multiaddr): Promise<void>;
}

type Node = {
    peerId: string;
    multiaddr: string;
};

/**
 * Creates a Fluence client. If the `connectTo` is specified connects the client to the network
 * @param { string | Multiaddr | Node } [connectTo] - Node in Fluence network to connect to. If not specified client will not be connected to the n
 * @param { PeerId | string } [peerIdOrSeed] - The Peer Id of the created client. Specified either as PeerId structure or as seed string. Will be generated randomly if not specified
 * @returns { Promise<FluenceClient> } Promise which will be resolved with the created FluenceClient
 */
export const createClient = async (
    connectTo?: string | Multiaddr | Node,
    peerIdOrSeed?: PeerId | string,
): Promise<FluenceClient> => {
    const res = await unstable.createClient(connectTo, peerIdOrSeed);
    return res as any;
};

export const checkConnection = async (client: FluenceClient): Promise<boolean> => {
    return unstable.checkConnection(client as any);
};

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
    const c = client as ClientImpl;
    const [req, errorPromise] = new RequestFlowBuilder()
        .withRawScript(particle.script)
        .withVariables(particle.data)
        .withTTL(particle.ttl)
        .buildWithErrorHandling();

    errorPromise.catch(onError);

    await c.initiateFlow(req);
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
    const unregister = (client as ClientImpl).aquaCallHandler.on(serviceId, fnName, handler);
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
        .withRawScript(particle.script)
        .withVariables(particle.data)
        .withTTL(particle.ttl)
        .buildAsFetch<T>(callbackServiceId, callbackFnName);

    await (client as ClientImpl).initiateFlow(request);

    return promise;
};
