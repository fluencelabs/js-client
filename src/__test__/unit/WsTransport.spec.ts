import { FluenceConnection } from '../../internal/FluenceConnection';
import Peer from 'libp2p';
import { Multiaddr } from 'multiaddr';
import { randomPeerId } from '../../internal/peerIdUtils';

describe('Ws Transport', () => {
    // TODO:: fix test
    test.skip('Should work with ws schema', async () => {
        // arrange
        let multiaddr = new Multiaddr(
            '/ip4/127.0.0.1/tcp/1234/ws/p2p/12D3KooWMJ78GJrtCxVUpjLEedbPtnLDxkFQJ2wuefEdrxq6zwSs',
        );
        let peerId = await randomPeerId();
        const connection = new FluenceConnection(multiaddr, peerId, peerId, (_) => {});
        await (connection as any).createPeer();
        let node = (connection as any).node as Peer;

        // act
        let transport = node.transportManager.transportForMultiaddr(multiaddr);

        // assert
        expect(transport).toBeDefined();
    });
});
