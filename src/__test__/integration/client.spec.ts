import { encode } from 'bs58';
import { generatePeerId, peerIdToSeed, seedToPeerId } from '../../internal/peerIdUtils';
import { FluenceClientImpl } from '../../internal/FluenceClientImpl';
import { createConnectedClient } from '../util';
import log from 'loglevel';
import { createClient } from '../../api';
import Multiaddr from 'multiaddr';

const devNodeAddress = '/dns4/dev.fluence.dev/tcp/19001/wss/p2p/12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9';
const devNodePeerId = '12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9';

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
            const addr = devNodeAddress;

            // act
            const client = (await createClient(addr)) as FluenceClientImpl;

            // assert
            const res = await testProcedure(client);
            expect(res).toEqual(['world']);
        });

        it('address as multiaddr', async function () {
            // arrange
            const addr = new Multiaddr(devNodeAddress);

            // act
            const client = (await createClient(addr)) as FluenceClientImpl;

            // assert
            const res = await testProcedure(client);
            expect(res).toEqual(['world']);
        });

        it('address as node', async function () {
            // arrange
            const addr = {
                multiaddr: devNodeAddress,
                peerId: devNodePeerId,
            };

            // act
            const client = (await createClient(addr)) as FluenceClientImpl;

            // assert
            const res = await testProcedure(client);
            expect(res).toEqual(['world']);
        });

        it('peerid as peer id', async function () {
            // arrange
            const addr = devNodeAddress;
            const pid = await generatePeerId();

            // act
            const client = (await createClient(addr, pid)) as FluenceClientImpl;

            // assert
            const res = await testProcedure(client);
            expect(res).toEqual(['world']);
        });

        it('peerid as seed', async function () {
            // arrange
            const addr = devNodeAddress;
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
        const client = await createConnectedClient(devNodeAddress);

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
        const client = await createConnectedClient(devNodeAddress);

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
        const client = await createConnectedClient(devNodeAddress);

        // act
        let script = `
        (call "${client.relayPeerId}" ("op" "identify") [] result)
        `;
        const data = new Map();
        data.set('__relay', client.relayPeerId);

        const [res] = await client.fetch(script, ['result'], data);

        // assert
        expect(res.external_addresses).not.toBeUndefined;
    });

    it('two clients should work inside the same time browser', async function () {
        // arrange
        const client1 = await createConnectedClient(devNodeAddress);
        const client2 = await createConnectedClient(devNodeAddress);

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

    it('event registration should work', async function () {
        // arrange
        const client1 = await createConnectedClient(devNodeAddress);
        const client2 = await createConnectedClient(devNodeAddress);

        client2.registerEvent('event_stream', 'test');
        const resMakingPromise = new Promise((resolve) => {
            client2.subscribe('event_stream', resolve);
        });

        // act
        let script = `
            (call "${client2.selfPeerId}" ("event_stream" "test") [hello])
        `;

        let data: Map<string, any> = new Map();
        data.set('hello', 'world');

        await client1.fireAndForget(script, data);

        // assert
        let res = await resMakingPromise;
        expect(res).toEqual({
            type: 'test',
            args: ['world'],
        });
    });
});
