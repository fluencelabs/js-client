import { generatePeerId } from '..';
import { createClient } from '../api';
import { FluenceClientImpl } from '../internal/FluenceClientImpl';

export const createLocalClient = async () => {
    const peerId = await generatePeerId();
    const client = new FluenceClientImpl(peerId);
    await client.local();
    return client;
};

export const createConnectedClient = async (node: string) => {
    return (await createClient(node)) as FluenceClientImpl;
};
