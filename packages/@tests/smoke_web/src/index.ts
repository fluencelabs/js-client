import { Fluence } from '@fluencelabs/js-client.api';

const relay = {
    multiaddr: '/ip4/127.0.0.1/tcp/4310/ws/p2p/12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
    peerId: '12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
};

const main = async () => {
    await Fluence.start({
        connectTo: relay,
    });
};

main()
    .then(() => console.log('done!'))
    .catch((err) => console.error('error: ', err));
