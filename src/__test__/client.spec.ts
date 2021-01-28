import { expect } from 'chai';

import 'mocha';
import { encode } from 'bs58';
import { certificateFromString, certificateToString, issue } from '../internal/trust/certificate';
import { TrustGraph } from '../internal/trust/trust_graph';
import { nodeRootCert } from '../internal/trust/misc';
import { generatePeerId, peerIdToSeed, seedToPeerId } from '../internal/peerIdUtils';
import { FluenceClient } from '../FluenceClient';
import { createConnectedClient, createLocalClient } from './util';
import log from 'loglevel';
import { createClient } from '../api';
import Multiaddr from 'multiaddr';
import {getModules} from "../helpers/builtin";

describe('Typescript usage suite', () => {
    it('should create private key from seed and back', async function () {
        // prettier-ignore
        let seed = [46, 188, 245, 171, 145, 73, 40, 24, 52, 233, 215, 163, 54, 26, 31, 221, 159, 179, 126, 106, 27, 199, 189, 194, 80, 133, 235, 42, 42, 247, 80, 201];
        let seedStr = encode(seed);
        log.trace('SEED STR: ' + seedStr);
        let pid = await seedToPeerId(seedStr);
        expect(peerIdToSeed(pid)).to.be.equal(seedStr);
    });

    it('should serialize and deserialize certificate correctly', async function () {
        let cert = `11
1111
5566Dn4ZXXbBK5LJdUsE7L3pG9qdAzdPY47adjzkhEx9
3HNXpW2cLdqXzf4jz5EhsGEBFkWzuVdBCyxzJUZu2WPVU7kpzPjatcqvdJMjTtcycVAdaV5qh2fCGphSmw8UMBkr
158981172690500
1589974723504
2EvoZAZaGjKWFVdr36F1jphQ5cW7eK3yM16mqEHwQyr7
4UAJQWzB3nTchBtwARHAhsn7wjdYtqUHojps9xV6JkuLENV8KRiWM3BhQByx5KijumkaNjr7MhHjouLawmiN1A4d
1590061123504
1589974723504`;

        let deser = await certificateFromString(cert);
        let ser = certificateToString(deser);

        expect(ser).to.be.equal(cert);
    });

    // delete `.skip` and run `npm run test` to check service's and certificate's api with Fluence nodes
    it.skip('should perform tests on certs', async function () {
        this.timeout(15000);
        await testCerts();
    });

    describe.skip('should make connection to network', async function () {
        this.timeout(30000);

        const testProcedure = async (client: FluenceClient) => {
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

            const res = await resMakingPromise;
            return res;
        };

        it('address as string', async function () {
            // arrange
            const addr =
                '/dns4/net01.fluence.dev/tcp/19001/wss/p2p/12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9';

            // act
            const client = await createClient(addr);

            // assert
            const res = await testProcedure(client);
            expect(res).to.deep.equal(['world']);
        });

        it('address as multiaddr', async function () {
            // arrange
            const addr = new Multiaddr(
                '/dns4/net01.fluence.dev/tcp/19001/wss/p2p/12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9',
            );

            // act
            const client = await createClient(addr);

            // assert
            const res = await testProcedure(client);
            expect(res).to.deep.equal(['world']);
        });

        it('address as node', async function () {
            // arrange
            const addr = {
                multiaddr:
                    '/dns4/net01.fluence.dev/tcp/19001/wss/p2p/12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9',
                peerId: '12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9',
            };

            // act
            const client = await createClient(addr);

            // assert
            const res = await testProcedure(client);
            expect(res).to.deep.equal(['world']);
        });

        it('peerid as peer id', async function () {
            // arrange
            const addr =
                '/dns4/net01.fluence.dev/tcp/19001/wss/p2p/12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9';
            const pid = await generatePeerId();

            // act
            const client = await createClient(addr, pid);

            // assert
            const res = await testProcedure(client);
            expect(res).to.deep.equal(['world']);
        });

        it('peerid as see', async function () {
            // arrange
            const addr =
                '/dns4/net01.fluence.dev/tcp/19001/wss/p2p/12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9';
            const pid = peerIdToSeed(await generatePeerId());

            // act
            const client = await createClient(addr, pid);

            // assert
            const res = await testProcedure(client);
            expect(res).to.deep.equal(['world']);
        });
    });

    it.skip('should make a call through the network', async function () {
        this.timeout(30000);
        // arrange
        const client = await createConnectedClient(
            '/dns4/net01.fluence.dev/tcp/19001/wss/p2p/12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9',
        );

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
        expect(res).to.deep.equal(['some d', 'some c', 'some b', 'some a']);
    });

    it.skip('fireAndForget should work', async function () {
        this.timeout(30000);
        // arrange
        const client = await createConnectedClient(
            '/dns4/net01.fluence.dev/tcp/19001/wss/p2p/12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9',
        );

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
        expect(res).to.deep.equal(['some d', 'some c', 'some b', 'some a']);
    });

    it.skip('add_module', async function () {
        this.timeout(30000);
        // arrange
        const client = await createConnectedClient(
            '/dns4/dev.fluence.dev/tcp/19003/wss/p2p/12D3KooWBUJifCTgaxAUrcM9JysqCcS4CS8tiYH5hExbdWCAoNwb',
        );

        let a = await getModules(client)
        console.log(a)
    });

    it.skip('fetch should work', async function () {
        this.timeout(30000);
        // arrange
        const client = await createConnectedClient(
            '/dns4/net01.fluence.dev/tcp/19001/wss/p2p/12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9',
        );

        // act
        let script = `
        (call "${client.relayPeerId}" ("op" "identify") [] result)
        `;
        const data = new Map();
        data.set('__relay', client.relayPeerId);

        const [res] = await client.fetch(script, ['result'], data);

        // assert
        expect(res.external_addresses).to.be.not.undefined;
    });

    it.skip('two clients should work inside the same time browser', async function () {
        // arrange
        const pid1 = await generatePeerId();
        const client1 = new FluenceClient(pid1);
        await client1.connect(
            '/dns4/dev.fluence.dev/tcp/19001/wss/p2p/12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9',
        );

        const pid2 = await generatePeerId();
        const client2 = new FluenceClient(pid2);
        await client2.connect(
            '/dns4/dev.fluence.dev/tcp/19001/wss/p2p/12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9',
        );

        let resMakingPromise = new Promise((resolve) => {
            client2.registerCallback('test', 'test', (args, _) => {
                resolve([...args]);
                return {};
            });
        });

        let script = `
            (seq
                (call "${client1.relayPeerId}" ("op" "identity") [])
                (call "${pid2.toB58String()}" ("test" "test") [a b c d])
            )
        `;

        let data: Map<string, any> = new Map();
        data.set('a', 'some a');
        data.set('b', 'some b');
        data.set('c', 'some c');
        data.set('d', 'some d');

        await client1.sendScript(script, data);

        let res = await resMakingPromise;
        expect(res).to.deep.equal(['some a', 'some b', 'some c', 'some d']);
    });

    it.skip('event registration should work', async function () {
        // arrange
        const pid1 = await generatePeerId();
        const client1 = new FluenceClient(pid1);
        await client1.connect(
            '/dns4/dev.fluence.dev/tcp/19001/wss/p2p/12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9',
        );

        const pid2 = await generatePeerId();
        const client2 = new FluenceClient(pid2);
        await client2.connect(
            '/dns4/dev.fluence.dev/tcp/19001/wss/p2p/12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9',
        );

        client2.registerEvent('event_stream', 'test');
        const resMakingPromise = new Promise((resolve) => {
            client2.subscribe('event_stream', resolve);
        });

        // act
        let script = `
            (call "${pid2.toB58String()}" ("event_stream" "test") [hello])
        `;

        let data: Map<string, any> = new Map();
        data.set('hello', 'world');

        await client1.fireAndForget(script, data);

        // assert
        let res = await resMakingPromise;
        expect(res).to.deep.equal({
            type: 'test',
            args: ['world'],
        });
    });
});

export async function testCerts() {
    const key1 = await generatePeerId();
    const key2 = await generatePeerId();

    // connect to two different nodes
    const cl1 = new FluenceClient(key1);
    const cl2 = new FluenceClient(key2);

    await cl1.connect('/dns4/134.209.186.43/tcp/9003/ws/p2p/12D3KooWBUJifCTgaxAUrcM9JysqCcS4CS8tiYH5hExbdWCAoNwb');
    await cl2.connect('/ip4/134.209.186.43/tcp/9002/ws/p2p/12D3KooWHk9BjDQBUqnavciRPhAYFvqKBe4ZiPPvde7vDaqgn5er');

    let trustGraph1 = new TrustGraph(/* cl1 */);
    let trustGraph2 = new TrustGraph(/* cl2 */);

    let issuedAt = new Date();
    let expiresAt = new Date();
    // certificate expires after one day
    expiresAt.setDate(new Date().getDate() + 1);

    // create root certificate for key1 and extend it with key2
    let rootCert = await nodeRootCert(key1);
    let extended = await issue(key1, key2, rootCert, expiresAt.getTime(), issuedAt.getTime());

    // publish certificates to Fluence network
    await trustGraph1.publishCertificates(key2.toB58String(), [extended]);

    // get certificates from network
    let certs = await trustGraph2.getCertificates(key2.toB58String());

    // root certificate could be different because nodes save trusts with bigger `expiresAt` date and less `issuedAt` date
    expect(certs[0].chain[1].issuedFor.toB58String()).to.be.equal(extended.chain[1].issuedFor.toB58String());
    expect(certs[0].chain[1].signature).to.be.equal(extended.chain[1].signature);
    expect(certs[0].chain[1].expiresAt).to.be.equal(extended.chain[1].expiresAt);
    expect(certs[0].chain[1].issuedAt).to.be.equal(extended.chain[1].issuedAt);

    await cl1.disconnect();
    await cl2.disconnect();
}
