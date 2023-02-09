import { fromByteArray } from 'base64-js';
import { Fluence } from '@fluencelabs/js-client.api';
import { getRelayTime } from './_aqua/smoke_test.js';

const relay = {
    multiaddr: '/ip4/127.0.0.1/tcp/4310/ws/p2p/12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
    peerId: '12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
};

const rndSk = () => {
    if (crypto.getRandomValues) {
        return crypto.getRandomValues(new Uint8Array(32));
    }

    // @ts-ignore
    return globalThis.crypto.webcrypto.getRandomValues(new Uint8Array(32));
};

export const main = async () => {
    console.log('starting fluence...');
    await Fluence.start({
        relay: relay,
        keyPair: {
            type: 'Ed25519',
            source: rndSk(),
        },
    });

    console.log('started fluence');
    const p = await Fluence.getPeer();

    console.log('my peer id: ', p.getStatus().peerId);
    console.log('my sk id: ', fromByteArray(p.getSk()));

    console.log('getting relay time...');
    const res = await getRelayTime(relay.peerId);
    console.log('got relay time, ', res);

    console.log('stopping fluence...');
    await Fluence.stop();
    console.log('stopped fluence...');
};

export const runMain = () => {
    main()
        .then(() => console.log('done!'))
        .catch((err) => console.error('error: ', err));
};
