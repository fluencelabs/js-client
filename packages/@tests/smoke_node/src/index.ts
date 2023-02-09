import '@fluencelabs/js-client.node';
import { Fluence } from '@fluencelabs/js-client.api';
import { getRelayTime } from './_aqua/smoke_test.js';

const relay = {
    multiaddr: '/ip4/127.0.0.1/tcp/4310/ws/p2p/12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
    peerId: '12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
};

export const main = async () => {
    console.log('starting fluence...');
    await Fluence.start({
        relay: relay,
    });
    console.log('started fluence');

    console.log('getting relay time...');
    const res = await getRelayTime(relay.peerId);
    console.log('got relay time, ', res);

    console.log('stopping fluence...');
    await Fluence.stop();
    console.log('stopped fluence...');
};
