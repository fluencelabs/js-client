import { Multiaddr } from 'multiaddr';
import { nodes } from '../connection';
import log from 'loglevel';
import { Fluence, FluencePeer } from '../../index';
import { checkConnection } from '../../internal/utils';
import { RequestFlowBuilder } from '../../internal/compilerSupport/v1';

const anotherPeer = new FluencePeer();

describe('Typescript usage suite', () => {
    afterEach(async () => {
        if (anotherPeer) {
            await anotherPeer.stop();
        }
    });

    it('should perform test for FluencePeer class correctly', () => {
        // arrange
        const peer: any = new FluencePeer();
        const number: any = 1;
        const object: any = { str: 'Hello!' };
        const undefinedVal: any = undefined;

        // act
        const isPeerPeer = FluencePeer.isInstance(peer);
        const isNumberPeer = FluencePeer.isInstance(number);
        const isObjectPeer = FluencePeer.isInstance(object);
        const isUndefinedPeer = FluencePeer.isInstance(undefinedVal);

        // act
        expect(isPeerPeer).toBe(true);
        expect(isNumberPeer).toBe(false);
        expect(isObjectPeer).toBe(false);
        expect(isUndefinedPeer).toBe(false);
    });

    describe('Should expose correct peer status', () => {
        it('Should expose correct status for uninitialized peer', () => {
            // arrange
            const peer = new FluencePeer();

            // act
            const status = peer.getStatus();

            // assert
            expect(status.isConnected).toBe(false);
            expect(status.isInitialized).toBe(false);
            expect(status.peerId).toBe(null);
            expect(status.relayPeerId).toBe(null);
        });

        it('Should expose correct status for initialized but not connected peer', async () => {
            // arrange
            const peer = new FluencePeer();
            await peer.start();

            // act
            const status = peer.getStatus();

            // assert
            expect(status.isConnected).toBe(false);
            expect(status.isInitialized).toBe(true);
            expect(status.peerId).not.toBe(null);
            expect(status.relayPeerId).toBe(null);

            await peer.stop();
        });

        it('Should expose correct status for connected peer', async () => {
            // arrnge
            const peer = new FluencePeer();
            await peer.start({ connectTo: nodes[0] });

            // act
            const status = peer.getStatus();

            // assert
            expect(status.isConnected).toBe(true);
            expect(status.isInitialized).toBe(true);
            expect(status.peerId).not.toBe(null);
            expect(status.relayPeerId).not.toBe(null);

            await peer.stop();
        });
    });

    it('should make a call through network', async () => {
        //     // arrange
        //     await anotherPeer.start({ connectTo: nodes[0] });
        //     // act
        //     const [request, promise] = new RequestFlowBuilder()
        //         .withRawScript(
        //             `(seq
        //     (call init_relay ("op" "identity") ["hello world!"] result)
        //     (call %init_peer_id% ("callback" "callback") [result])
        // )`,
        //         )
        //         .buildAsFetch<[string]>('callback', 'callback');
        //     await anotherPeer.internals.initiateFlow(request);
        //     // assert
        //     const [result] = await promise;
        //     expect(result).toBe('hello world!');
    });

    it('check connection should work', async function () {
        await anotherPeer.start({ connectTo: nodes[0] });

        let isConnected = await checkConnection(anotherPeer);

        expect(isConnected).toEqual(true);
    });

    it('check connection should work with ttl', async function () {
        await anotherPeer.start({ connectTo: nodes[0] });

        let isConnected = await checkConnection(anotherPeer, 10000);

        expect(isConnected).toEqual(true);
    });

    it('two clients should work inside the same time browser', async () => {
        // // arrange
        // const peer1 = new FluencePeer();
        // await peer1.start({ connectTo: nodes[0] });
        // const peer2 = new FluencePeer();
        // await peer2.start({ connectTo: nodes[0] });
        // let resMakingPromise = new Promise((resolve) => {
        //     peer2.internals.callServiceHandler.onEvent('test', 'test', (args, _) => {
        //         resolve([...args]);
        //     });
        // });
        // let script = `
        //     (seq
        //         (call "${peer1.getStatus().relayPeerId}" ("op" "identity") [])
        //         (call "${peer2.getStatus().peerId}" ("test" "test") [a b c d])
        //     )
        // `;
        // let data: Map<string, any> = new Map();
        // data.set('a', 'some a');
        // data.set('b', 'some b');
        // data.set('c', 'some c');
        // data.set('d', 'some d');
        // await peer1.internals.initiateFlow(new RequestFlowBuilder().withRawScript(script).withVariables(data).build());
        // let res = await resMakingPromise;
        // expect(res).toEqual(['some a', 'some b', 'some c', 'some d']);
        // await peer1.stop();
        // await peer2.stop();
    });

    describe('should make connection to network', () => {
        it('address as string', async () => {
            // arrange
            const addr = nodes[0];

            // act
            await anotherPeer.start({ connectTo: addr });
            const isConnected = await checkConnection(anotherPeer);

            // assert
            expect(isConnected).toBeTruthy;
        });

        it('address as multiaddr', async () => {
            // arrange
            const addr = new Multiaddr(nodes[0].multiaddr);

            // act
            await anotherPeer.start({ connectTo: addr });
            const isConnected = await checkConnection(anotherPeer);

            // assert
            expect(isConnected).toBeTruthy;
        });

        it('address as node', async () => {
            // arrange
            const addr = nodes[0];

            // act
            await anotherPeer.start({ connectTo: addr });
            const isConnected = await checkConnection(anotherPeer);

            // assert
            expect(isConnected).toBeTruthy;
        });

        it('peerid as peer id', async () => {
            // arrange
            const addr = nodes[0];

            // act
            await anotherPeer.start({ connectTo: addr });
            const isConnected = await checkConnection(anotherPeer);

            // assert
            expect(isConnected).toBeTruthy;
        });

        it('peerid as seed', async () => {
            // arrange
            const addr = nodes[0];

            // act
            await anotherPeer.start({ connectTo: addr });
            const isConnected = await checkConnection(anotherPeer);

            // assert
            expect(isConnected).toBeTruthy;
        });

        it('With connection options: dialTimeout', async () => {
            // arrange
            const addr = nodes[0];

            // act
            await anotherPeer.start({ connectTo: addr, dialTimeoutMs: 100000 });
            const isConnected = await checkConnection(anotherPeer);

            // assert
            expect(isConnected).toBeTruthy;
        });

        it('With connection options: skipCheckConnection', async () => {
            // arrange
            const addr = nodes[0];

            // act
            await anotherPeer.start({ connectTo: addr, skipCheckConnection: true });
            const isConnected = await checkConnection(anotherPeer);

            // assert
            expect(isConnected).toBeTruthy;
        });

        it('With connection options: checkConnectionTTL', async () => {
            // arrange
            const addr = nodes[0];

            // act
            await anotherPeer.start({ connectTo: addr, checkConnectionTimeoutMs: 1000 });
            const isConnected = await checkConnection(anotherPeer);

            // assert
            expect(isConnected).toBeTruthy;
        });
    });

    it('xor handling should work with connected client', async function () {
        // arrange
        // const [request, promise] = new RequestFlowBuilder()
        //     .withRawScript(
        //         `
        //     (seq
        //         (call init_relay ("op" "identity") [])
        //         (call init_relay ("incorrect" "service") ["incorrect_arg"])
        //     )
        // `,
        //     )
        //     .buildWithErrorHandling();
        // // act
        // await anotherPeer.start({ connectTo: nodes[0] });
        // await anotherPeer.internals.initiateFlow(request);
        // // assert
        // await expect(promise).rejects.toMatchObject({
        //     msg: expect.stringContaining("Service with id 'incorrect' not found"),
        //     instruction: expect.stringContaining('incorrect'),
        // });
    });

    it('xor handling should work with local client', async function () {
        // arrange
        // const [request, promise] = new RequestFlowBuilder()
        //     .withRawScript(
        //         `
        //     (call %init_peer_id% ("service" "fails") [])
        //     `,
        //     )
        //     .configHandler((h) => {
        //         h.use(async (req, res, _) => {
        //             res.retCode = 1;
        //             res.result = 'service failed internally';
        //         });
        //     })
        //     .buildWithErrorHandling();
        // // act
        // await anotherPeer.start();
        // await anotherPeer.internals.initiateFlow(request);
        // // assert
        // await expect(promise).rejects.toMatch('service failed internally');
    });

    it.skip('Should throw correct message when calling non existing local service', async function () {
        // arrange
        // await anotherPeer.start();
        // // act
        // const res = callIdentifyOnInitPeerId(anotherPeer);
        // // assert
        // await expect(res).rejects.toMatchObject({
        //     msg: expect.stringContaining(
        //         `The handler did not set any result. Make sure you are calling the right peer and the handler has been registered. Original request data was: serviceId='peer' fnName='identify' args=''\"'`,
        //     ),
        //     instruction: 'call %init_peer_id% ("peer" "identify") [] res',
        // });
    });

    it('Should not crash if undefined is passed as a variable', async () => {
        // arrange
        // await anotherPeer.start();
        // const [request, promise] = new RequestFlowBuilder()
        //     .withRawScript(
        //         `
        //         (seq
        //          (call %init_peer_id% ("op" "identity") [arg] res)
        //          (call %init_peer_id% ("return" "return") [res])
        //         )
        //     `,
        //     )
        //     .withVariable('arg', undefined as any)
        //     .buildAsFetch<any[]>('return', 'return');
        // // act
        // await anotherPeer.internals.initiateFlow(request);
        // const [res] = await promise;
        // // assert
        // expect(res).toBe(null);
    });

    it('Should throw correct error when the client tries to send a particle not to the relay', async () => {
        // arrange
        // await anotherPeer.start();
        // // act
        // const [req, promise] = new RequestFlowBuilder()
        //     .withRawScript('(call "incorrect_peer_id" ("any" "service") [])')
        //     .buildWithErrorHandling();
        // await anotherPeer.internals.initiateFlow(req);
        // // assert
        // await expect(promise).rejects.toMatch(
        //     'Particle is expected to be sent to only the single peer (relay which client is connected to)',
        // );
    });
});

async function callIdentifyOnInitPeerId(peer: FluencePeer): Promise<string[]> {
    let request;
    const promise = new Promise<string[]>((resolve, reject) => {
        request = new RequestFlowBuilder()
            .withRawScript(
                `
  (call %init_peer_id% ("peer" "identify") [] res)
            `,
            )
            .handleScriptError(reject)
            .build();
    });
    await peer.internals.initiateFlow(request);
    return promise;
}
