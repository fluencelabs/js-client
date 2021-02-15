import { encode } from 'bs58';
import { certificateFromString, certificateToString, issue } from '../../internal/trust/certificate';
import { TrustGraph } from '../../internal/trust/trust_graph';
import { nodeRootCert } from '../../internal/trust/misc';
import { generatePeerId, peerIdToSeed, seedToPeerId } from '../../internal/peerIdUtils';
import { FluenceClientTmp } from '../../internal/FluenceClientTmp';
import { createConnectedClient, createLocalClient } from '../util';
import log from 'loglevel';
import { createClient, sendParticle, sendParticleAsFetch, subscribeToEvent } from '../../api';
import Multiaddr from 'multiaddr';
import { RequestFlow } from '../../internal/particle';

const devNodeAddress = '/dns4/dev.fluence.dev/tcp/19001/wss/p2p/12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9';
const devNodePeerId = '12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9';

describe('Api tests', () => {
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

        await sendParticle(client, new RequestFlow(script, data));

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

        const [res] = await sendParticleAsFetch(client, new RequestFlow(script, data), 'getResult');

        // assert
        expect(res.external_addresses).not.toBeUndefined;
    });

    it('event registration should work', async function () {
        // arrange
        const pid1 = await generatePeerId();
        const client1 = new FluenceClientTmp(pid1);
        await client1.connect(devNodeAddress);

        const pid2 = await generatePeerId();
        const client2 = new FluenceClientTmp(pid2);
        await client2.connect(devNodeAddress);

        const resMakingPromise = new Promise((resolve) => {
            subscribeToEvent(client2, 'event_stream', 'test', (args, _) => {
                resolve(args);
            });
        });

        // act
        let script = `
        (call "${pid2.toB58String()}" ("event_stream" "test") [hello])
    `;

        let data: Map<string, any> = new Map();
        data.set('hello', 'world');

        await sendParticle(client1, new RequestFlow(script, data));

        // assert
        let res = await resMakingPromise;
        expect(res).toEqual({
            type: 'test',
            args: ['world'],
        });
    });
});
