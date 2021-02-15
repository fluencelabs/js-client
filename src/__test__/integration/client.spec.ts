import { encode } from 'bs58';
import { certificateFromString, certificateToString, issue } from '../../internal/trust/certificate';
import { TrustGraph } from '../../internal/trust/trust_graph';
import { nodeRootCert } from '../../internal/trust/misc';
import { generatePeerId, peerIdToSeed, seedToPeerId } from '../../internal/peerIdUtils';
import { FluenceClientTmp } from '../../internal/FluenceClientTmp';
import { createConnectedClient } from '../util';
import log from 'loglevel';
import { createClient, sendParticle } from '../../api';
import Multiaddr from 'multiaddr';
import { RequestFlow } from '../../internal/particle';

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

        expect(ser).toEqual(cert);
    });

    it.skip('should perform tests on certs', async function () {
        await testCerts();
    });

    describe('should make connection to network', function () {
        const testProcedure = async (client: FluenceClientTmp) => {
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

            await client.sendParticle(new RequestFlow(script, data));

            const res = await resMakingPromise;
            return res;
        };

        it('address as string', async function () {
            // arrange
            const addr = devNodeAddress;

            // act
            const client = (await createClient(addr)) as FluenceClientTmp;

            // assert
            const res = await testProcedure(client);
            expect(res).toEqual(['world']);
        });

        it('address as multiaddr', async function () {
            // arrange
            const addr = new Multiaddr(devNodeAddress);

            // act
            const client = (await createClient(addr)) as FluenceClientTmp;

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
            const client = (await createClient(addr)) as FluenceClientTmp;

            // assert
            const res = await testProcedure(client);
            expect(res).toEqual(['world']);
        });

        it('peerid as peer id', async function () {
            // arrange
            const addr = devNodeAddress;
            const pid = await generatePeerId();

            // act
            const client = (await createClient(addr, pid)) as FluenceClientTmp;

            // assert
            const res = await testProcedure(client);
            expect(res).toEqual(['world']);
        });

        it('peerid as seed', async function () {
            // arrange
            const addr = devNodeAddress;
            const pid = peerIdToSeed(await generatePeerId());

            // act
            const client = (await createClient(addr, pid)) as FluenceClientTmp;

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

        await sendParticle(client, new RequestFlow(script, data));

        // assert
        const res = await resMakingPromise;
        expect(res).toEqual(['some d', 'some c', 'some b', 'some a']);
    });

    it('two clients should work inside the same time browser', async function () {
        // arrange
        const pid1 = await generatePeerId();
        const client1 = new FluenceClientTmp(pid1);
        await client1.connect(devNodeAddress);

        const pid2 = await generatePeerId();
        const client2 = new FluenceClientTmp(pid2);
        await client2.connect(devNodeAddress);

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

        await client1.sendParticle(new RequestFlow(script, data));

        let res = await resMakingPromise;
        expect(res).toEqual(['some a', 'some b', 'some c', 'some d']);
    });
});

export async function testCerts() {
    const key1 = await generatePeerId();
    const key2 = await generatePeerId();

    // connect to two different nodes
    const cl1 = new FluenceClientTmp(key1);
    const cl2 = new FluenceClientTmp(key2);

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
    expect(certs[0].chain[1].issuedFor.toB58String()).toEqual(extended.chain[1].issuedFor.toB58String());
    expect(certs[0].chain[1].signature).toEqual(extended.chain[1].signature);
    expect(certs[0].chain[1].expiresAt).toEqual(extended.chain[1].expiresAt);
    expect(certs[0].chain[1].issuedAt).toEqual(extended.chain[1].issuedAt);

    await cl1.disconnect();
    await cl2.disconnect();
}
