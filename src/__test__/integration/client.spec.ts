import { encode } from 'bs58';
import { generatePeerId, peerIdToSeed, seedToPeerId } from '../../internal/peerIdUtils';
import { FluenceClientImpl } from '../../internal/FluenceClientImpl';
import log from 'loglevel';
import { createClient, subscribeForErrors } from '../../api';
import Multiaddr from 'multiaddr';
import { createConnectedClient, createLocalClient, nodes } from '../connection';

describe('Typescript usage suite', () => {
    it('should create private key from seed and back', async function () {
        // prettier-ignore
        let seed = [46, 188, 245, 171, 145, 73, 40, 24, 52, 233, 215, 163, 54, 26, 31, 221, 159, 179, 126, 106, 27, 199, 189, 194, 80, 133, 235, 42, 42, 247, 80, 201];
        let seedStr = encode(seed);
        log.trace('SEED STR: ' + seedStr);
        let pid = await seedToPeerId(seedStr);
        expect(peerIdToSeed(pid)).toEqual(seedStr);
    });

    describe('should make connection to network', function () {
        const testProcedure = async (client: FluenceClientImpl) => {
            let resMakingPromise = new Promise((resolve) => {
                client.registerCallback('test', 'test', (args, _) => {
                    resolve(args);
                    return {};
                });
            });

            let script = `
                (seq
                    (call "${client.relayPeerId}" ("op" "identity") [])
                    (call "${client.selfPeerId}" ("test" "test") [hello])
                )
            `;

            let data: Map<string, any> = new Map();
            data.set('hello', 'world');

            await client.sendScript(script, data);

            return await resMakingPromise;
        };

        it('address as string', async function () {
            // arrange
            const addr = nodes[0].multiaddr;

            // act
            const client = (await createClient(addr)) as FluenceClientImpl;

            // assert
            const res = await testProcedure(client);
            expect(res).toEqual(['world']);
        });

        it('address as multiaddr', async function () {
            // arrange
            const addr = new Multiaddr(nodes[0].multiaddr);

            // act
            const client = (await createClient(addr)) as FluenceClientImpl;

            // assert
            const res = await testProcedure(client);
            expect(res).toEqual(['world']);
        });

        it('address as node', async function () {
            // arrange
            const addr = nodes[0];

            // act
            const client = (await createClient(addr)) as FluenceClientImpl;

            // assert
            const res = await testProcedure(client);
            expect(res).toEqual(['world']);
        });

        it('peerid as peer id', async function () {
            // arrange
            const addr = nodes[0].multiaddr;
            const pid = await generatePeerId();

            // act
            const client = (await createClient(addr, pid)) as FluenceClientImpl;

            // assert
            const res = await testProcedure(client);
            expect(res).toEqual(['world']);
        });

        it('peerid as seed', async function () {
            // arrange
            const addr = nodes[0].multiaddr;
            const pid = peerIdToSeed(await generatePeerId());

            // act
            const client = (await createClient(addr, pid)) as FluenceClientImpl;

            // assert
            const res = await testProcedure(client);
            expect(res).toEqual(['world']);
        });
    });

    it('should make a call through the network', async function () {
        // arrange
        const client = await createConnectedClient(nodes[0].multiaddr);

        client.registerCallback('test', 'test', (args, _) => {
            log.trace('should make a call through the network, called "test" "test" with args', args);
            return {};
        });

        let resMakingPromise = new Promise((resolve) => {
            client.registerCallback('test', 'reverse_args', (args, _) => {
                resolve([...args].reverse());
                return {};
            });
        });

        // act
        let script = `
            (seq
                (call "${client.relayPeerId}" ("op" "identity") [])
                (seq
                    (call "${client.selfPeerId}" ("test" "test") [a b c d] result)
                    (call "${client.selfPeerId}" ("test" "reverse_args") [a b c d])
                )
            )
        `;

        let data: Map<string, any> = new Map();
        data.set('a', 'some a');
        data.set('b', 'some b');
        data.set('c', 'some c');
        data.set('d', 'some d');

        await client.sendScript(script, data);

        // assert
        const res = await resMakingPromise;
        expect(res).toEqual(['some d', 'some c', 'some b', 'some a']);
    });

    it('fireAndForget should work', async function () {
        // arrange
        const client = await createConnectedClient(nodes[0].multiaddr);

        let resMakingPromise = new Promise((resolve) => {
            client.registerCallback('test', 'reverse_args', (args, _) => {
                resolve([...args].reverse());
                return {};
            });
        });

        // act
        let script = `
        (call "${client.selfPeerId}" ("test" "reverse_args") [a b c d])
        `;

        let data: Map<string, any> = new Map();
        data.set('a', 'some a');
        data.set('b', 'some b');
        data.set('c', 'some c');
        data.set('d', 'some d');

        await client.fireAndForget(script, data);

        // assert
        const res = await resMakingPromise;
        expect(res).toEqual(['some d', 'some c', 'some b', 'some a']);
    });

    it('fetch should work', async function () {
        // arrange
        const client = await createConnectedClient(nodes[0].multiaddr);

        // act
        let script = `
        (call "${client.relayPeerId}" ("peer" "identify") [] result)
        `;
        const data = new Map();
        data.set('__relay', client.relayPeerId);

        const [res] = await client.fetch(script, ['result'], data);

        // assert
        expect(res.external_addresses).not.toBeUndefined;
    });

    it('two clients should work inside the same time browser', async function () {
        // arrange
        const client1 = await createConnectedClient(nodes[0].multiaddr);
        const client2 = await createConnectedClient(nodes[0].multiaddr);

        let resMakingPromise = new Promise((resolve) => {
            client2.registerCallback('test', 'test', (args, _) => {
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

        await client1.sendScript(script, data);

        let res = await resMakingPromise;
        expect(res).toEqual(['some a', 'some b', 'some c', 'some d']);
    });

    // will fix with the new api
    it('xor handling should work with connected client', async function () {
        // arrange
        const client = await createConnectedClient(nodes[0].multiaddr);
        log.setLevel('info');

        // act
        let script = `
            (seq 
                (call relay ("op" "identity") [])
                (call relay ("incorrect" "service") ["incorrect_arg"])
            )
        `;
        const data = new Map();
        data.set('relay', client.relayPeerId);

        const promise = subscribeForErrors(client, 7000);
        await client.sendScript(script, data);

        // assert
        await expect(promise).rejects.toMatchObject({
            error: expect.stringContaining("Service with id 'incorrect' not found"),
            instruction: expect.stringContaining('incorrect'),
        });
    });

    it('xor handling should work with local client', async function () {
        // arrange
        const client = await createLocalClient();

        // act
        let script = `(call %init_peer_id% ("incorrect" "service") ["incorrect_arg"])`;

        const promise = subscribeForErrors(client, 7000);
        await client.sendScript(script);

        // assert
        await expect(promise).rejects.toMatchObject({
            error: expect.stringContaining('There is no service: incorrect'),
            instruction: expect.stringContaining('incorrect'),
        });
    });
});
