import { FluencePeer } from '../../index';
import { test } from '../_aqua/shit';

let peer: FluencePeer;

describe('Test test', () => {
    afterEach(async () => {
        if (peer) {
            await peer.stop();
        }
    });

    beforeEach(async () => {
        peer = new FluencePeer();
        await peer.start({
            connectTo: '/dns4/stage.fluence.dev/tcp/19002/wss/p2p/12D3KooWMigkP4jkVyufq5JnDJL6nXvyjeaDNpRfEZqQhsG3sYCU'
        });
    });

    it('shit', async () => {
        const res = await test(peer, 1, {ttl: 5000})

        expect(res).toBe(1);
    });

});

    