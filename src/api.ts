import { FluenceClient } from './FluenceClient';
import { SecurityTetraplet } from './internal/commonTypes';
import Multiaddr from 'multiaddr';
import PeerId, { isPeerId } from 'peer-id';
import { generatePeerId, seedToPeerId } from './internal/peerIdUtils';
import { FluenceClientTmp } from './internal/FluenceClientTmp';
import { RequestFlow } from './internal/RequestFlow';
import log from 'loglevel';
import { RequestFlowBuilder } from './internal/RequestFlowBuilder';

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

    const client = new FluenceClientTmp(peerId);

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
    }

    return client;
};

export const checkConnection = async (client: FluenceClient): Promise<boolean> => {
    let msg = Math.random().toString(36).substring(7);
    let callbackFn = 'checkConnection';
    let callbackService = '_callback';

    const [request, promise] = new RequestFlowBuilder()
        .withRawScript(
            `(seq 
        (call relay ("op" "identity") [msg] result)
        (call myPeerId ("${callbackService}" "${callbackFn}") [result])
    )`,
        )
        .withVariables({
            relay: client.relayPeerId,
            myPeerId: client.selfPeerId,
            msg,
        })
        .buildWithFetchSemantics<string[][]>(callbackFn, callbackService);

    if (!client.isConnected) {
        return false;
    }

    await client.initiateFlow(request);

    try {
        let result = await promise;
        if (result[0][0] != msg) {
            log.warn("unexpected behavior. 'identity' must return arguments the passed arguments.");
        }
        return true;
    } catch (e) {
        log.error('Error on establishing connection: ', e);
        return false;
    }
};
