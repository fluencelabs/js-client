import { Fluence, setLogLevel } from '../../..';
import { registerCustomId, viaArr, viaOpt, viaStream } from './via';

const krasnodar = [
    {
        multiaddr: '/dns4/kras-00.fluence.dev/tcp/19990/wss/p2p/12D3KooWSD5PToNiLQwKDXsu8JSysCwUt8BVUJEqCHcDe7P5h45e',
        peerId: '12D3KooWSD5PToNiLQwKDXsu8JSysCwUt8BVUJEqCHcDe7P5h45e',
    },
    {
        multiaddr: '/dns4/kras-00.fluence.dev/tcp/19001/wss/p2p/12D3KooWR4cv1a8tv7pps4HH6wePNaK6gf1Hww5wcCMzeWxyNw51',
        peerId: '12D3KooWR4cv1a8tv7pps4HH6wePNaK6gf1Hww5wcCMzeWxyNw51',
    },
    {
        multiaddr: '/dns4/kras-01.fluence.dev/tcp/19001/wss/p2p/12D3KooWKnEqMfYo9zvfHmqTLpLdiHXPe4SVqUWcWHDJdFGrSmcA',
        peerId: '12D3KooWKnEqMfYo9zvfHmqTLpLdiHXPe4SVqUWcWHDJdFGrSmcA',
    },
    {
        multiaddr: '/dns4/kras-02.fluence.dev/tcp/19001/wss/p2p/12D3KooWHLxVhUQyAuZe6AHMB29P7wkvTNMn7eDMcsqimJYLKREf',
        peerId: '12D3KooWHLxVhUQyAuZe6AHMB29P7wkvTNMn7eDMcsqimJYLKREf',
    },
    {
        multiaddr: '/dns4/kras-03.fluence.dev/tcp/19001/wss/p2p/12D3KooWJd3HaMJ1rpLY1kQvcjRPEvnDwcXrH8mJvk7ypcZXqXGE',
        peerId: '12D3KooWJd3HaMJ1rpLY1kQvcjRPEvnDwcXrH8mJvk7ypcZXqXGE',
    },
    {
        multiaddr: '/dns4/kras-04.fluence.dev/tcp/19001/wss/p2p/12D3KooWFEwNWcHqi9rtsmDhsYcDbRUCDXH84RC4FW6UfsFWaoHi',
        peerId: '12D3KooWFEwNWcHqi9rtsmDhsYcDbRUCDXH84RC4FW6UfsFWaoHi',
    },
    {
        multiaddr: '/dns4/kras-05.fluence.dev/tcp/19001/wss/p2p/12D3KooWCMr9mU894i8JXAFqpgoFtx6qnV1LFPSfVc3Y34N4h4LS',
        peerId: '12D3KooWCMr9mU894i8JXAFqpgoFtx6qnV1LFPSfVc3Y34N4h4LS',
    },
    {
        multiaddr: '/dns4/kras-06.fluence.dev/tcp/19001/wss/p2p/12D3KooWDUszU2NeWyUVjCXhGEt1MoZrhvdmaQQwtZUriuGN1jTr',
        peerId: '12D3KooWDUszU2NeWyUVjCXhGEt1MoZrhvdmaQQwtZUriuGN1jTr',
    },
    {
        multiaddr: '/dns4/kras-07.fluence.dev/tcp/19001/wss/p2p/12D3KooWEFFCZnar1cUJQ3rMWjvPQg6yMV2aXWs2DkJNSRbduBWn',
        peerId: '12D3KooWEFFCZnar1cUJQ3rMWjvPQg6yMV2aXWs2DkJNSRbduBWn',
    },
    {
        multiaddr: '/dns4/kras-08.fluence.dev/tcp/19001/wss/p2p/12D3KooWFtf3rfCDAfWwt6oLZYZbDfn9Vn7bv7g6QjjQxUUEFVBt',
        peerId: '12D3KooWFtf3rfCDAfWwt6oLZYZbDfn9Vn7bv7g6QjjQxUUEFVBt',
    },
    {
        multiaddr: '/dns4/kras-09.fluence.dev/tcp/19001/wss/p2p/12D3KooWD7CvsYcpF9HE9CCV9aY3SJ317tkXVykjtZnht2EbzDPm',
        peerId: '12D3KooWD7CvsYcpF9HE9CCV9aY3SJ317tkXVykjtZnht2EbzDPm',
    },
];

async function viaCall(): Promise<string[][]> {
    const relayPeerId = Fluence.getPeer().getStatus().relayPeerId;

    registerCustomId({
        id: (args0) => {
            return args0;
        },
    });

    let res = await viaArr(krasnodar[4].peerId, [krasnodar[2].peerId, krasnodar[1].peerId]);
    let res2 = await viaOpt(relayPeerId, krasnodar[4].peerId, krasnodar[2].peerId);
    let res3 = await viaOpt(relayPeerId, krasnodar[4].peerId, krasnodar[2].peerId || null);
    let res4 = await viaStream(krasnodar[4].peerId, [krasnodar[2].peerId, krasnodar[1].peerId]);

    return [res.external_addresses, res2.external_addresses, res3.external_addresses, res4.external_addresses];
}

setLogLevel('debug');

describe('Testing examples', () => {
    beforeAll(async () => {
        await Fluence.start({ connectTo: krasnodar[0] });
    });

    afterAll(async () => {
        Fluence.stop();
    });

    it('via.aqua', async () => {
        const relayPeerId = Fluence.getPeer().getStatus().relayPeerId;

        registerCustomId({
            id: (args0) => {
                return args0;
            },
        });

        let res = await viaArr(krasnodar[4].peerId, [krasnodar[2].peerId, krasnodar[1].peerId]);
        let res2 = await viaOpt(relayPeerId, krasnodar[4].peerId, krasnodar[2].peerId);
        let res3 = await viaOpt(relayPeerId, krasnodar[4].peerId, krasnodar[2].peerId || null);
        let res4 = await viaStream(krasnodar[4].peerId, [krasnodar[2].peerId, krasnodar[1].peerId]);

        const resAll = [
            res.external_addresses,
            res2.external_addresses,
            res3.external_addresses,
            res4.external_addresses,
        ];

        expect(resAll).toBe('not_correct');
    });
});
