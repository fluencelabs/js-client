import { checkConnection, createClient, FluenceClient } from '../../FluenceClient';
import Multiaddr from 'multiaddr';
import { nodes } from '../connection';
import { RequestFlowBuilder } from '../../internal/RequestFlowBuilder';

let client: FluenceClient;

describe('Typescript usage suite', () => {
    afterEach(async () => {
        if (client) {
            await client.disconnect();
        }
    });

    it('should make a call through network', async () => {
        // arrange
        client = await createClient();
        await client.connect(nodes[0].multiaddr);

        // act
        const [request, promise] = new RequestFlowBuilder()
            .withDefaults()
            .withRawScript(
                `(seq 
        (call init_relay ("op" "identity") ["hello world!"] result)
        (call %init_peer_id% ("callback" "callback") [result])
    )`,
            )
            .buildAsFetch<[[string]]>('callback', 'callback');
        await client.initiateFlow(request);

        // assert
        const [[result]] = await promise;
        expect(result).toBe('hello world!');
    });

    it('check connection should work', async function () {
        client = await createClient();
        await client.connect(nodes[0].multiaddr);

        let isConnected = await checkConnection(client);

        expect(isConnected).toEqual(true);
    });

    it('check connection should work with ttl', async function () {
        client = await createClient();
        await client.connect(nodes[0].multiaddr);

        let isConnected = await checkConnection(client, 10000);

        expect(isConnected).toEqual(true);
    });

    it('two clients should work inside the same time browser', async () => {
        // arrange
        const client1 = await createClient(nodes[0].multiaddr);
        const client2 = await createClient(nodes[0].multiaddr);

        let resMakingPromise = new Promise((resolve) => {
            client2.aquaCallHandler.onEvent('test', 'test', (args, _) => {
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

        await client1.initiateFlow(
            new RequestFlowBuilder().withDefaults().withRawScript(script).withVariables(data).build(),
        );

        let res = await resMakingPromise;
        expect(res).toEqual(['some a', 'some b', 'some c', 'some d']);

        await client1.disconnect();
        await client2.disconnect();
    });

    describe('should make connection to network', () => {
        it('address as string', async () => {
            // arrange
            const addr = nodes[0].multiaddr;

            // act
            client = await createClient(addr);
            const isConnected = await checkConnection(client);

            // assert
            expect(isConnected).toBeTruthy;
        });

        it('address as multiaddr', async () => {
            // arrange
            const addr = new Multiaddr(nodes[0].multiaddr);

            // act
            client = await createClient(addr);
            const isConnected = await checkConnection(client);

            // assert
            expect(isConnected).toBeTruthy;
        });

        it('address as node', async () => {
            // arrange
            const addr = nodes[0];

            // act
            client = await createClient(addr);
            const isConnected = await checkConnection(client);

            // assert
            expect(isConnected).toBeTruthy;
        });

        it('peerid as peer id', async () => {
            // arrange
            const addr = nodes[0].multiaddr;

            // act
            client = await createClient(addr);
            const isConnected = await checkConnection(client);

            // assert
            expect(isConnected).toBeTruthy;
        });

        it('peerid as seed', async () => {
            // arrange
            const addr = nodes[0].multiaddr;

            // act
            client = await createClient(addr);
            const isConnected = await checkConnection(client);

            // assert
            expect(isConnected).toBeTruthy;
        });

        it('With connection options: dialTimeout', async () => {
            // arrange
            const addr = nodes[0].multiaddr;

            // act
            client = await createClient(addr, undefined, { dialTimeout: 100000 });
            const isConnected = await checkConnection(client);

            // assert
            expect(isConnected).toBeTruthy;
        });

        it('With connection options: skipCheckConnection', async () => {
            // arrange
            const addr = nodes[0].multiaddr;

            // act
            client = await createClient(addr, undefined, { skipCheckConnection: true });
            const isConnected = await checkConnection(client);

            // assert
            expect(isConnected).toBeTruthy;
        });

        it('With connection options: checkConnectionTTL', async () => {
            // arrange
            const addr = nodes[0].multiaddr;

            // act
            client = await createClient(addr, undefined, { checkConnectionTTL: 1000 });
            const isConnected = await checkConnection(client);

            // assert
            expect(isConnected).toBeTruthy;
        });
    });

    it('xor handling should work with connected client', async function () {
        // arrange
        const [request, promise] = new RequestFlowBuilder()
            .withDefaults()
            .withRawScript(
                `
            (seq 
                (call init_relay ("op" "identity") [])
                (call init_relay ("incorrect" "service") ["incorrect_arg"])
            )
        `,
            )
            .buildWithErrorHandling();

        // act
        client = await createClient(nodes[0].multiaddr);
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
            .withDefaults()
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
        client = await createClient();
        await client.initiateFlow(request);

        // assert
        await expect(promise).rejects.toMatch('service failed internally');
    });

    it('Should throw correct message when calling non existing local service', async function () {
        // arrange
        client = await createClient();

        // act
        const res = getPeerExternalAddresses(client);

        // assert
        await expect(res).rejects.toMatch(
            "The handler did not set any result. Make sure you are calling the right peer and the handler has been registered. Original request data was: serviceId='peer' fnName='identify' args=''",
        );
    });
});

async function getPeerExternalAddresses(client: FluenceClient): Promise<string[]> {
    let request;
    const promise = new Promise<string[]>((resolve, reject) => {
        request = new RequestFlowBuilder()
            .withRawScript(
                `
(seq
 (seq
  (call %init_peer_id% ("getDataSrv" "relay") [] relay)
  (call %init_peer_id% ("peer" "identify") [] res)
 )
 (call %init_peer_id% ("callbackSrv" "response") [res.$.external_addresses!])
)

            `,
            )
            .configHandler((h) => {
                h.on('getDataSrv', 'relay', () => {
                    return client.relayPeerId;
                });
                h.on('getRelayService', 'hasReleay', () => {
                    // Not Used
                    return client.relayPeerId !== undefined;
                });

                h.on('callbackSrv', 'response', (args) => {
                    const [res] = args;
                    resolve(res);
                });

                h.on('nameOfServiceWhereToSendXorError', 'errorProbably', (args) => {
                    // assuming error is the single argument
                    const [err] = args;
                    reject(err);
                });
            })
            .handleScriptError(reject)
            .handleTimeout(() => {
                reject('Request timed out');
            })
            .build();
    });
    await client.initiateFlow(request);
    return promise;
}
