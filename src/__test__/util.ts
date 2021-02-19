import {generatePeerId} from '..';
import {FluenceClientImpl} from '../internal/FluenceClientImpl';

export const createLocalClient = async () => {
    const peerId = await generatePeerId();
    const client = new FluenceClientImpl(peerId);
    await client.local();
    return client;
};

export const createConnectedClient = async (node: string) => {
    const peerId = await generatePeerId();
    const client = new FluenceClientImpl(peerId);
    await client.connect(node);
    return client;
};
