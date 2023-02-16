import { fromByteArray } from 'base64-js';
import { Fluence } from '@fluencelabs/js-client.api';
import { kras, randomKras } from '@fluencelabs/fluence-network-environment';
import { smokeTest } from './_aqua/smoke_test.js';

// const relay = {
//     multiaddr: '/ip4/127.0.0.1/tcp/4310/ws/p2p/12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
//     peerId: '12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
// };

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

export const main = async () => {
    try {
        Fluence.onConnectionStateChange((state) => console.info('connection state changed: ', state));

        console.log('connecting to Fluence Network...');
        await Fluence.connect(relay, optsWithRandomKeyPair());

        console.log('connected');
        const client = await Fluence.getClient();

        console.log('my peer id: ', client.getPeerId());
        console.log('my sk id: ', fromByteArray(client.getPeerSecretKey()));

        console.log('running some aqua...');
        const [res, errors] = await smokeTest('my_resource');
        if (res === null) {
            console.log('aqua failed, errors', errors);
        } else {
            console.log('aqua finished, result', res);
        }
    } finally {
        console.log('disconnecting from Fluence Network...');
        await Fluence.disconnect();
        console.log('disconnected');
    }
};

export const runMain = () => {
    main()
        .then(() => console.log('done!'))
        .catch((err) => console.error('error: ', err));
};
