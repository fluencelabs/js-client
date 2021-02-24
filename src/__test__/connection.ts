import { generatePeerId } from '..';
import { createClient } from '../api';
import { FluenceClientImpl } from '../internal/FluenceClientImpl';

// Uncomment to test on dev nodes
// export const nodes = [
//     {
//         multiaddr: '/dns4/dev.fluence.dev/tcp/19003/wss/p2p/12D3KooWBUJifCTgaxAUrcM9JysqCcS4CS8tiYH5hExbdWCAoNwb',
//         peerId: '12D3KooWBUJifCTgaxAUrcM9JysqCcS4CS8tiYH5hExbdWCAoNwb',
//     },
//     {
//         multiaddr: '/dns4/dev.fluence.dev/tcp/19004/wss/p2p/12D3KooWJbJFaZ3k5sNd8DjQgg3aERoKtBAnirEvPV8yp76kEXHB',
//         peerId: '12D3KooWJbJFaZ3k5sNd8DjQgg3aERoKtBAnirEvPV8yp76kEXHB',
//     },
// ];

// start docker container to run tests integration locally
// > docker run --rm -e RUST_LOG="info" -p 1210:1210 -p 4310:4310 fluencelabs/fluence:builtin -t 1210 -w 4310 -k gKdiCSUr1TFGFEgu2t8Ch1XEUsrN5A2UfBLjSZvfci9SPR3NvZpACfcpPGC3eY4zma1pk7UvYv5zb1VjvPHwCjj
export const nodes = [
    {
        multiaddr: '/ip4/127.0.0.1/tcp/4310/ws/p2p/12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
        peerId: '12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
    },
    {
        multiaddr: '/ip4/127.0.0.1/tcp/4310/ws/p2p/12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
        peerId: '12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
    },
];

export const createLocalClient = async () => {
    const peerId = await generatePeerId();
    const client = new FluenceClientImpl(peerId);
    await client.local();
    return client;
};

export const createConnectedClient = async (node: string) => {
    return (await createClient(node)) as FluenceClientImpl;
};
