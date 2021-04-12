// this.node.transportManager.transportForMultiaddr()

import {AquaCallHandler} from "../../internal/AquaHandler";
import {createClient} from "../../FluenceClient";
import {FluenceConnection} from "../../internal/FluenceConnection";
import Peer from "libp2p";
import Multiaddr = require("multiaddr");
import * as PeerId from "peer-id";

describe('Ws Transport', () => {
    it('Should work with ws schema', async () => {
        // arrange
        let multiaddr = new Multiaddr("/ip4/127.0.0.1/tcp1234/ws/12D3KooWMJ78GJrtCxVUpjLEedbPtnLDxkFQJ2wuefEdrxq6zwSs");
        const connection = new FluenceConnection(
            multiaddr,
            await PeerId.create(),
            await PeerId.create(),
            _ => {},
        );
        let node = (connection as any).node as Peer;

        // act
        let transport = node.transportManager.transportForMultiaddr(multiaddr);

        // assert
        expect(transport).not.toBeDefined();
    });
});
