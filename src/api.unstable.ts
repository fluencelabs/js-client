import Multiaddr from 'multiaddr';
import PeerId, { isPeerId } from 'peer-id';
import { generatePeerId, seedToPeerId } from './internal/peerIdUtils';
import { ClientImpl } from './internal/ClientImpl';
import log from 'loglevel';
import { RequestFlowBuilder } from './internal/RequestFlowBuilder';
import { PeerIdB58 } from './internal/commonTypes';
import { AquaCallHandler } from './internal/AquaHandler';
import { RequestFlow } from './internal/RequestFlow';

export { RequestFlowBuilder } from './internal/RequestFlowBuilder';

export interface FluenceClient {
    readonly relayPeerId: PeerIdB58;
    readonly selfPeerId: PeerIdB58;
    readonly isConnected: boolean;

    readonly handler: AquaCallHandler;

    disconnect(): Promise<void>;

    /**
     * Establish a connection to the node. If the connection is already established, disconnect and reregister all services in a new connection.
     *
     * @param multiaddr
     */
    connect(multiaddr: string | Multiaddr): Promise<void>;

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
 * @returns { Promise<FluenceClient> } Promise which will be resolved with the created FluenceClient
 */
export const createClient = async (
    connectTo?: string | Multiaddr | Node,
    peerIdOrSeed?: PeerId | string,
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

    if (connectTo) {
        let theAddress: Multiaddr;
        let fromNode = (connectTo as any).multiaddr;
        if (fromNode) {
            theAddress = new Multiaddr(fromNode);
        } else {
            theAddress = new Multiaddr(connectTo as string);
        }

        await client.connect(theAddress);
        if (!(await checkConnection(client))) {
            throw new Error('Connection check failed. Check if the node is working or try to connect to another node');
        }
    } else {
        await client.local();
    }

    return client;
};

export const checkConnection = async (client: FluenceClient): Promise<boolean> => {
    if (!client.isConnected) {
        return false;
    }

    const msg = Math.random().toString(36).substring(7);
    const callbackFn = 'checkConnection';
    const callbackService = '_callback';

    const [request, promise] = new RequestFlowBuilder()
        .withRawScript(
            `(seq 
        (call init_peer_relay ("op" "identity") [msg] result)
        (call %init_peer_id% ("${callbackService}" "${callbackFn}") [result])
    )`,
        )
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
