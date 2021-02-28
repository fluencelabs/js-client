import { generatePeerId, peerIdToSeed } from '../../internal/peerIdUtils';
import { checkConnection, createClient } from '../../api';
import Multiaddr from 'multiaddr';
import { nodes } from '../connection';
import { RequestFlowBuilder } from '../../internal/RequestFlowBuilder';
import { FluenceClientTmp } from '../../internal/FluenceClientTmp';

describe('Typescript usage suite', () => {
    describe('should make connection to network', () => {
        it('address as string', async () => {
            // arrange
            const addr = nodes[0].multiaddr;

            // act
            const client = await createClient(addr);
            const isConnected = await checkConnection(client);

            // assert
            expect(isConnected).toBeTruthy;
        });

        it('address as multiaddr', async () => {
            // arrange
            const addr = new Multiaddr(nodes[0].multiaddr);

            // act
            const client = await createClient(addr);
            const isConnected = await checkConnection(client);

            // assert
            expect(isConnected).toBeTruthy;
        });

        it('address as node', async () => {
            // arrange
            const addr = nodes[0];

            // act
            const client = await createClient(addr);
            const isConnected = await checkConnection(client);

            // assert
            expect(isConnected).toBeTruthy;
        });

        it('peerid as peer id', async () => {
            // arrange
            const addr = nodes[0].multiaddr;

            // act
            const client = await createClient(addr);
            const isConnected = await checkConnection(client);

            // assert
            expect(isConnected).toBeTruthy;
        });

        it('peerid as seed', async () => {
            // arrange
            const addr = nodes[0].multiaddr;

            // act
            const client = await createClient(addr);
            const isConnected = await checkConnection(client);

            // assert
            expect(isConnected).toBeTruthy;
        });
    });
    1;
    it('should make a call through network', async () => {
        // arrange
        const peerId = await generatePeerId();
        const client = new FluenceClientTmp(peerId);
        await client.local();
        await client.connect(nodes[0].multiaddr);

        // act
        const [request, promise] = new RequestFlowBuilder()
            .withRawScript(
                `(seq 
        (call init_peer_relay ("op" "identity") ["hello world!"] result)
        (call %init_peer_id% ("callback" "callback") [result])
    )`,
            )
            .buildWithFetchSemantics<[[string]]>('callback', 'callback');
        await client.initiateFlow(request);

        // assert
        const [[result]] = await promise;
        expect(result).toBe('hello world!');
    });

    it('two clients should work inside the same time browser', async () => {
        // arrange
        const client1 = await createClient(nodes[0].multiaddr);
        const client2 = await createClient(nodes[0].multiaddr);

        let resMakingPromise = new Promise((resolve) => {
            client2.handler.onEvent('test', 'test', (args, _) => {
                resolve([...args]);
                return {};
            });
        });

        let script = `
            (seq
                (call "${client1.relayPeerId}" ("op" "identity") [])
                (call "${client2.selfPeerId}" ("test" "test") [a b c d])
            )
        `;

        let data: Map<string, any> = new Map();
        data.set('a', 'some a');
        data.set('b', 'some b');
        data.set('c', 'some c');
        data.set('d', 'some d');

        await client1.initiateFlow(new RequestFlowBuilder().withRawScript(script).withVariables(data).build());

        let res = await resMakingPromise;
        expect(res).toEqual(['some a', 'some b', 'some c', 'some d']);
    });
});
