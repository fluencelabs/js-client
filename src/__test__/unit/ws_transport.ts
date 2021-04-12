// this.node.transportManager.transportForMultiaddr()

import {AquaCallHandler} from "../../internal/AquaHandler";
import {createClient} from "../../FluenceClient";
import {FluenceConnection} from "../../internal/FluenceConnection";
import Peer from "libp2p";
import Multiaddr = require("multiaddr");

describe('Ws Transport', () => {
    it('Should work with ws schema', async () => {
        // arrange
        const connection = new FluenceConnection(
            null,
            null,
            null,
            null
        );
        let node = (connection as any).node as Peer;

        // act
        let multiaddr = new Multiaddr("/ip4/127.0.0.1/tcp1234/ws/12D3KooWMJ78GJrtCxVUpjLEedbPtnLDxkFQJ2wuefEdrxq6zwSs");
        let transport = node.transportManager.transportForMultiaddr(multiaddr);

        // assert
        expect(transport).not.toBeDefined();
    });
});
