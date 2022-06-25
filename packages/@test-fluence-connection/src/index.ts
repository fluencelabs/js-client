import { fromByteArray } from 'base64-js';
import { KeyPair } from '@fluencelabs/fluence-keypair';
import { FluenceConnection } from '@fluencelabs/fluence-connection';
import { createPeerId } from '@libp2p/peer-id';

const particle = {
    action: 'Particle',
    id: 'd802a662-ece2-4ba0-a744-bd2f469ffca3',
    ttl: 7000,
    data: fromByteArray(Buffer.from([])),
    signature: [],
};

/*
const relay = {
    multiaddr: '/dns4/kras-00.fluence.dev/tcp/19990/wss/p2p/12D3KooWSD5PToNiLQwKDXsu8JSysCwUt8BVUJEqCHcDe7P5h45e',
    peerId: '12D3KooWSD5PToNiLQwKDXsu8JSysCwUt8BVUJEqCHcDe7P5h45e',
};
*/

const relay = {
    multiaddr: '/ip4/127.0.0.1/tcp/4310/ws/p2p/12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
    peerId: '12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
};

const main = async () => {
    const kp = await KeyPair.randomEd25519();
    const pid = kp.libp2pPeerId.toString();

    const script = `
                (seq
                    (call "${relay.peerId}" ("op" "noop") [])
                    (call "${pid}" ("op" "noop") [])
                )`;

    const promise = new Promise(async (resolve) => {
        const conn = await FluenceConnection.createConnection({
            peerId: kp.libp2pPeerId,
            relayAddress: relay.multiaddr,
            onIncomingParticle: (p: string) => {
                console.log(p);
                conn.disconnect();
                resolve(p);
            },
        });

        conn.connect();

        console.log(pid);

        const particleJson = { ...particle, init_peer_id: pid, timestamp: Date.now(), script };
        const particleString = JSON.stringify(particleJson);

        console.log(particleString);

        await conn.sendParticle(particleString);
    });

    /*
    const res = await Promise.race([
        // new line
        promise,
        new Promise((resolve) => setTimeout(resolve, 7000)),
    ]);
    */
    return await promise;
};

main()
    .then((res) => {
        console.log(res);
        console.log('done!');
    })
    .catch((err) => {
        console.error(err);
    });
