import { fromByteArray } from 'base64-js';
import { Fluence } from '@fluencelabs/js-client.api';
import { krasnodar } from '@fluencelabs/fluence-network-environment';
import { smokeTest } from './_aqua/smoke_test.js';

// const relay = {
//     multiaddr: '/ip4/127.0.0.1/tcp/4310/ws/p2p/12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
//     peerId: '12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
// };

const relay = krasnodar[4];

const rndSk = () => {
    // if (getRandomValues) {
    //     return getRandomValues(new Uint8Array(32));
    // }
    // @ts-ignore
    // return globalThis.crypto.webcrypto.getRandomValues(new Uint8Array(32));
};

export const main = async () => {
    try {
        console.log('connecting to Fluence Network...');
        await Fluence.connect(relay, {
            // keyPair: {
            //     type: 'Ed25519',
            //     source: rndSk(),
            // },
        });

        console.log('connected');
        const p = await Fluence.getPeer();

        console.log('my peer id: ', p.getStatus().peerId);
        console.log('my sk id: ', fromByteArray(p.getSk()));

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
