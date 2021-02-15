import { generatePeerId } from '..';
import { FluenceClientTmp } from '../internal/FluenceClientTmp';

export const createLocalClient = async () => {
    const peerId = await generatePeerId();
    const client = new FluenceClientTmp(peerId);
    await client.local();
    return client;
};

export const createConnectedClient = async (node: string) => {
    const peerId = await generatePeerId();
    const client = new FluenceClientTmp(peerId);
    await client.connect(node);
    return client;
};
