import { KeyPair } from '@fluencelabs/fluence-keypair';
import { FluenceConnection } from '@fluencelabs/fluence-connection';
import { createPeerId } from '@libp2p/peer-id';

const particle = `
{"action":"Particle",
"id":"d802a662-ece2-4ba0-a744-bd2f469ffca3",
"init_peer_id":"12D3KooWGgXWERRKwA9rp3zUmwg2DiSctka91WMQAgVNKm4kaMbx",
"timestamp":1655732200026,
"ttl":7000,
"script":"\n    (xor\n        (seq\n            (call %init_peer_id% (\"load\" \"relay\") [] init_relay)\n            (seq\n                (call init_relay (\"op\" \"identity\") [\"hello world!\"] result)\n                (call %init_peer_id% (\"callback\" \"callback\") [result])\n            )\n        )\n        (seq \n            (call init_relay (\"op\" \"identity\") [])\n            (call %init_peer_id% (\"callback\" \"error\") [%last_error%])\n        )\n    )","signature":[],"data":"eyJ0cmFjZSI6W3siY2FsbCI6eyJleGVjdXRlZCI6eyJzY2FsYXIiOiIxMkQzS29vV1NENVBUb05pTFF3S0RYc3U4SlN5c0N3VXQ4QlZVSkVxQ0hjRGU3UDVoNDVlIn19fSx7ImNhbGwiOnsic2VudF9ieSI6IjEyRDNLb29XR2dYV0VSUkt3QTlycDN6VW13ZzJEaVNjdGthOTFXTVFBZ1ZOS200a2FNYngifX1dLCJzdHJlYW1zIjp7fSwidmVyc2lvbiI6IjAuMi4yIiwibGNpZCI6MSwicl9zdHJlYW1zIjp7fX0="}
`;

const addr = '/dns4/kras-00.fluence.dev/tcp/19990/wss/p2p/12D3KooWSD5PToNiLQwKDXsu8JSysCwUt8BVUJEqCHcDe7P5h45e';

const main = async () => {
    let conn: any = undefined;
    const res = new Promise(async (resolve) => {
        conn = await FluenceConnection.createConnection({
            onIncomingParticle: (p) => {
                resolve(p);
            },
            peerId: await (await KeyPair.randomEd25519()).libp2pPeerId,
            relayAddress: addr,
        });
    });

    await conn.connect();

    await conn.sendParticle(particle);

    await res;

    await conn.disconnect();
};

main()
    .then((res) => {
        console.log('done!');
    })
    .catch((err) => {
        console.error(err);
    });
