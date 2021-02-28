import { generatePeerId, peerIdToSeed } from '../../internal/peerIdUtils';
import { checkConnection, createClient, FluenceClient } from '../../api.unstable';
import Multiaddr from 'multiaddr';
import { createLocalClient, nodes } from '../connection';
import { RequestFlowBuilder } from '../../internal/RequestFlowBuilder';
import { ClientImpl } from '../../internal/ClientImpl';

describe('Typescript usage suite', () => {
    it('should make a call through network', async () => {
        // arrange
        const peerId = await generatePeerId();
        const client = new ClientImpl(peerId);
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

    it('check connection should work', async function () {
        const peerId = await generatePeerId();
        const client = new ClientImpl(peerId);
        await client.local();
        await client.connect(nodes[0].multiaddr);

        let isConnected = await checkConnection(client);

        expect(isConnected).toEqual(true);
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

    it('xor handling should work with connected client', async function () {
        // arrange
        const [request, promise] = new RequestFlowBuilder()
            .withRawScript(
                `
            (seq 
                (call init_peer_relay ("op" "identity") [])
                (call init_peer_relay ("incorrect" "service") ["incorrect_arg"])
            )
        `,
            )
            .buildWithErrorHandling();

        // act
        const client = await createClient(nodes[0].multiaddr);
        await client.initiateFlow(request);

        // assert
        await expect(promise).rejects.toMatchObject({
            error: expect.stringContaining("Service with id 'incorrect' not found"),
            instruction: expect.stringContaining('incorrect'),
        });
    });

    it('xor handling should work with local client', async function () {
        // arrange
        const [request, promise] = new RequestFlowBuilder()
            .withRawScript(
                `
            (call %init_peer_id% ("service" "fails") [])
            `,
            )
            .configHandler((h) => {
                h.use((req, res, _) => {
                    res.retCode = 1;
                    res.result = 'service failed internally';
                });
            })
            .buildWithErrorHandling();

        // act
        const client = await createLocalClient();
        await client.initiateFlow(request);

        // assert
        await expect(promise).rejects.toMatch('service failed internally');
    });
});
