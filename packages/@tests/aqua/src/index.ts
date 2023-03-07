import { fromByteArray } from 'base64-js';
import { Fluence } from '@fluencelabs/js-client.api';
import { kras, randomKras } from '@fluencelabs/fluence-network-environment';
import { registerHelloWorld, smokeTest } from './_aqua/smoke_test.js';

// Relay running on local machine
// const relay = {
//     multiaddr: '/ip4/127.0.0.1/tcp/4310/ws/p2p/12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
//     peerId: '12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
// };

// Currently the tests executes some calls to registry. And they fail for a single local node setup. So we use kras instead.
const relay = randomKras();

function generateRandomUint8Array() {
    const uint8Array = new Uint8Array(32);
    for (let i = 0; i < uint8Array.length; i++) {
        uint8Array[i] = Math.floor(Math.random() * 256);
    }
    return uint8Array;
}

const optsWithRandomKeyPair = () => {
    return {
        keyPair: {
            type: 'Ed25519',
            source: generateRandomUint8Array(),
        },
    } as const;
};

export type TestResult = { res: string | null; errors: string[]; hello: string };

export const runTest = async (): Promise<TestResult> => {
    try {
        Fluence.onConnectionStateChange((state) => console.info('connection state changed: ', state));

        console.log('connecting to Fluence Network...');
        await Fluence.connect(relay, optsWithRandomKeyPair());

        console.log('connected');

        const relayPeerId = (await Fluence.getClient()).getRelayPeerId();
        console.log('relay:', relayPeerId);

        await registerHelloWorld({
            hello(str) {
                return 'Hello, ' + str + '!';
            },
        });

        const client = await Fluence.getClient();

        console.log('my peer id: ', client.getPeerId());
        console.log('my sk id: ', fromByteArray(client.getPeerSecretKey()));

        console.log('running some aqua...');
        const [res, errors, hello] = await smokeTest('my_resource');
        console.log(hello);
        if (res === null) {
            console.log('aqua failed, errors', errors);
        } else {
            console.log('aqua finished, result', res);
        }

        return { res, errors, hello };
    } finally {
        console.log('disconnecting from Fluence Network...');
        await Fluence.disconnect();
        console.log('disconnected');
    }
};

export const runMain = () => {
    runTest()
        .then(() => console.log('done!'))
        .catch((err) => console.error('error: ', err));
};
