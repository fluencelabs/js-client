import { fromByteArray } from 'base64-js';
import { Fluence } from '@fluencelabs/js-client';
import type { ClientConfig } from '@fluencelabs/js-client';
import { registerHelloWorld, helloTest, marineTest, resourceTest } from './_aqua/smoke_test.js';
import { test as particleTest } from './_aqua/finalize_particle.js';
import { wasm } from './wasmb64.js';

const relay = {
    multiaddr: '/ip4/127.0.0.1/tcp/9991/ws/p2p/12D3KooWBM3SdXWqGaawQDGQ6JprtwswEg3FWGvGhmgmMez1vRbR',
    peerId: '12D3KooWBM3SdXWqGaawQDGQ6JprtwswEg3FWGvGhmgmMez1vRbR',
};

function generateRandomUint8Array() {
    const uint8Array = new Uint8Array(32);
    for (let i = 0; i < uint8Array.length; i++) {
        uint8Array[i] = Math.floor(Math.random() * 256);
    }
    return uint8Array;
}

const optsWithRandomKeyPair = (): ClientConfig => {
    return {
        keyPair: {
            type: 'Ed25519',
            source: generateRandomUint8Array(),
        },
    } as const;
};

export type TestResult = { type: 'success'; data: string } | { type: 'failure'; error: string };

export const runTest = async (): Promise<TestResult> => {
    try {
        Fluence.onConnectionStateChange((state) => console.info('connection state changed: ', state));

        console.log('connecting to Fluence Network...');
        console.log('multiaddr: ', relay.multiaddr);
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

        console.log('running resource test...');
        const [res, errors] = await resourceTest('my_resource');
        if (res === null) {
            console.log('resource test failed, errors', errors);
            return { type: 'failure', error: errors.join(', ') };
        } else {
            console.log('resource test finished, result', res);
        }

        console.log('running hello test...');
        const hello = await helloTest();
        console.log('hello test finished, result: ', hello);

        console.log('running marine test...');
        const marine = await marineTest(wasm);

        console.log('running particle test...');
        await particleTest();
        
        console.log('marine test finished, result: ', marine);

        const returnVal = {
            res,
            hello,
            // marine,
        };
        return { type: 'success', data: JSON.stringify(returnVal) };
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
