import { FluenceClient, generatePeerId } from '..';

export const createLocalClient = async () => {
    const peerId = await generatePeerId();
    const client = new FluenceClient(peerId);
    await client.local();
    return client;
};

export const createConnectedClient = async (node: string) => {
    const peerId = await generatePeerId();
    const client = new FluenceClient(peerId);
    await client.connect(node);
    return client;
};
