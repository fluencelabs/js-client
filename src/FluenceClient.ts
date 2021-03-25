import log from 'loglevel';
import Multiaddr from 'multiaddr';
import PeerId, { isPeerId } from 'peer-id';

import { AquaCallHandler } from './internal/AquaHandler';
import { ClientImpl } from './internal/ClientImpl';
import { PeerIdB58 } from './internal/commonTypes';
import { FluenceConnectionOptions } from './internal/FluenceConnection';
import { generatePeerId, seedToPeerId } from './internal/peerIdUtils';
import { RequestFlow } from './internal/RequestFlow';
import { RequestFlowBuilder } from './internal/RequestFlowBuilder';

/**
 * The class represents interface to Fluence Platform. To create a client use @see {@link createClient} function.
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
     * The base handler which is used by every RequestFlow executed by this FluenceClient.
     * Please note, that the handler is combined with the handler from RequestFlow before the execution occures.
     * After this combination, middlewares from RequestFlow are executed before client handler's middlewares.
     */
    readonly aquaCallHandler: AquaCallHandler;

    /**
     * Disconnects the client from the network
     */
    disconnect(): Promise<void>;

    /**
     * Establish a connection to the node. If the connection is already established, disconnect and reregister all services in a new connection.
     *
     * @param multiaddr
     */
    connect(multiaddr: string | Multiaddr): Promise<void>;

    /**
     * Initiates RequestFlow execution @see { @link RequestFlow }
     * @param { RequestFlow } [ request ] - RequestFlow to start the execution of
     */
    initiateFlow(request: RequestFlow): Promise<void>;
}

type Node = {
    peerId: string;
    multiaddr: string;
};

/**
 * Creates a Fluence client. If the `connectTo` is specified connects the client to the network
 * @param { string | Multiaddr | Node } [connectTo] - Node in Fluence network to connect to. If not specified client will not be connected to the n
 * @param { PeerId | string } [peerIdOrSeed] - The Peer Id of the created client. Specified either as PeerId structure or as seed string. Will be generated randomly if not specified
 * @param { FluenceConnectionOptions } [options] - additional configuraton options for Fluence Connection made with the client
 * @returns { Promise<FluenceClient> } Promise which will be resolved with the created FluenceClient
 */
export const createClient = async (
    connectTo?: string | Multiaddr | Node,
    peerIdOrSeed?: PeerId | string,
    options?: FluenceConnectionOptions,
): Promise<FluenceClient> => {
    let peerId;
    if (!peerIdOrSeed) {
        peerId = await generatePeerId();
    } else if (isPeerId(peerIdOrSeed)) {
        // keep unchanged
        peerId = peerIdOrSeed;
    } else {
        // peerId is string, therefore seed
        peerId = await seedToPeerId(peerIdOrSeed);
    }

    const client = new ClientImpl(peerId);
    await client.initAquamarineRuntime();

    if (connectTo) {
        let theAddress: Multiaddr;
        let fromNode = (connectTo as any).multiaddr;
        if (fromNode) {
            theAddress = new Multiaddr(fromNode);
        } else {
            theAddress = new Multiaddr(connectTo as string);
        }

        await client.connect(theAddress, options);

        if (options && !options.skipCheckConnection) {
            if (!(await checkConnection(client, options.checkConnectionTTL))) {
                throw new Error(
                    'Connection check failed. Check if the node is working or try to connect to another node',
                );
            }
        }
    }

    return client;
};

/**
 * Checks the network connection by sending a ping-like request to relat node
 * @param { FluenceClient } client - The Fluence Client instance.
 */
export const checkConnection = async (client: FluenceClient, ttl?: number): Promise<boolean> => {
    if (!client.isConnected) {
        return false;
    }

    const msg = Math.random().toString(36).substring(7);
    const callbackFn = 'checkConnection';
    const callbackService = '_callback';

    const [request, promise] = new RequestFlowBuilder()
        .withRawScript(
            `(seq 
        (call init_relay ("op" "identity") [msg] result)
        (call %init_peer_id% ("${callbackService}" "${callbackFn}") [result])
    )`,
        )
        .withTTL(ttl)
        .withVariables({
            msg,
        })
        .buildAsFetch<[[string]]>(callbackService, callbackFn);

    await client.initiateFlow(request);

    try {
        const [[result]] = await promise;
        if (result != msg) {
            log.warn("unexpected behavior. 'identity' must return arguments the passed arguments.");
        }
        return true;
    } catch (e) {
        log.error('Error on establishing connection: ', e);
        return false;
    }
};
