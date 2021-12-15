import { Multiaddr } from 'multiaddr';

import { Fluence, FluencePeer, setLogLevel } from '../../index';
import { Particle } from '../../internal/Particle';
import { checkConnection, doNothing, handleTimeout } from '../../internal/utils';
import { nodes } from '../connection';
import { registerHandlersHelper } from '../util';

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
            // arrange
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
        // arrange
        await anotherPeer.start({ connectTo: nodes[0] });

        // act
        const promise = new Promise<string[]>((resolve, reject) => {
            const script = `
    (xor
        (seq
            (call %init_peer_id% ("load" "relay") [] init_relay)
            (seq
                (call init_relay ("op" "identity") ["hello world!"] result)
                (call %init_peer_id% ("callback" "callback") [result])
            )
        )
        (seq 
            (call init_relay ("op" "identity") [])
            (call %init_peer_id% ("callback" "error") [%last_error%])
        )
    )`;
            const particle = Particle.createNew(script);
            registerHandlersHelper(anotherPeer, particle, {
                load: {
                    relay: (args) => {
                        return anotherPeer.getStatus().relayPeerId;
                    },
                },
                callback: {
                    callback: (args) => {
                        const [val] = args;
                        resolve(val);
                    },
                    error: (args) => {
                        const [error] = args;
                        reject(error);
                    },
                },
            });

            anotherPeer.internals.initiateParticle(particle, handleTimeout(reject));
        });

        // assert
        const result = await promise;
        expect(result).toBe('hello world!');
    });

    it('check connection should work', async function () {
        await anotherPeer.start({ connectTo: nodes[0] });

        const isConnected = await checkConnection(anotherPeer);

        expect(isConnected).toEqual(true);
    });

    it('check connection should work with ttl', async function () {
        await anotherPeer.start({ connectTo: nodes[0] });

        const isConnected = await checkConnection(anotherPeer, 10000);

        expect(isConnected).toEqual(true);
    });

    it('two clients should work inside the same time browser', async () => {
        // arrange
        const peer1 = new FluencePeer();
        await peer1.start({ connectTo: nodes[0] });
        const peer2 = new FluencePeer();
        await peer2.start({ connectTo: nodes[0] });

        // act
        const resMakingPromise = new Promise((resolve) => {
            peer2.internals.callServiceHandler.onEvent('test', 'test', (args, _) => {
                resolve(args[0]);
            });
        });

        const script = `
            (seq
                (call "${peer1.getStatus().relayPeerId}" ("op" "identity") [])
                (call "${peer2.getStatus().peerId}" ("test" "test") ["test"])
            )
        `;
        const particle = Particle.createNew(script);
        await peer1.internals.initiateParticle(particle, doNothing);

        // assert
        const res = await resMakingPromise;
        expect(res).toEqual('test');

        await peer1.stop();
        await peer2.stop();
    });

    describe('should make connection to network', () => {
        it('address as string', async () => {
            // arrange
            const addr = nodes[0];

            // act
            await anotherPeer.start({ connectTo: addr });
            const isConnected = await checkConnection(anotherPeer);

            // assert
            expect(isConnected).toBeTruthy();
        });

        it('address as multiaddr', async () => {
            // arrange
            const addr = new Multiaddr(nodes[0].multiaddr);

            // act
            await anotherPeer.start({ connectTo: addr });
            const isConnected = await checkConnection(anotherPeer);

            // assert
            expect(isConnected).toBeTruthy();
        });

        it('address as node', async () => {
            // arrange
            const addr = nodes[0];

            // act
            await anotherPeer.start({ connectTo: addr });
            const isConnected = await checkConnection(anotherPeer);

            // assert
            expect(isConnected).toBeTruthy();
        });

        it('peerid as peer id', async () => {
            // arrange
            const addr = nodes[0];

            // act
            await anotherPeer.start({ connectTo: addr });
            const isConnected = await checkConnection(anotherPeer);

            // assert
            expect(isConnected).toBeTruthy();
        });

        it('peerid as seed', async () => {
            // arrange
            const addr = nodes[0];

            // act
            await anotherPeer.start({ connectTo: addr });
            const isConnected = await checkConnection(anotherPeer);

            // assert
            expect(isConnected).toBeTruthy();
        });

        it('With connection options: dialTimeout', async () => {
            // arrange
            const addr = nodes[0];

            // act
            await anotherPeer.start({ connectTo: addr, dialTimeoutMs: 100000 });
            const isConnected = await checkConnection(anotherPeer);

            // assert
            expect(isConnected).toBeTruthy();
        });

        it('With connection options: skipCheckConnection', async () => {
            // arrange
            const addr = nodes[0];

            // act
            await anotherPeer.start({ connectTo: addr, skipCheckConnection: true });
            const isConnected = await checkConnection(anotherPeer);

            // assert
            expect(isConnected).toBeTruthy();
        });

        it('With connection options: checkConnectionTTL', async () => {
            // arrange
            const addr = nodes[0];

            // act
            await anotherPeer.start({ connectTo: addr, checkConnectionTimeoutMs: 1000 });
            const isConnected = await checkConnection(anotherPeer);

            // assert
            expect(isConnected).toBeTruthy();
        });

        it('With connection options: defaultTTL', async () => {
            // arrange
            const addr = nodes[0];

            // act
            await anotherPeer.start({ connectTo: addr, defaultTtlMs: 1 });
            const isConnected = await checkConnection(anotherPeer);

            // assert
            expect(isConnected).toBeFalsy();
        });
    });

    it('Should successfully call identity on local peer', async function () {
        // arrange
        await anotherPeer.start();

        // act
        const promise = new Promise<string>((resolve, reject) => {
            const script = `
            (seq
                (call %init_peer_id% ("op" "identity") ["test"] res)
                (call %init_peer_id% ("callback" "callback") [res])
            )
            `;
            const particle = Particle.createNew(script);
            registerHandlersHelper(anotherPeer, particle, {
                callback: {
                    callback: async (args) => {
                        const [res] = args;
                        resolve(res);
                    },
                },
            });

            anotherPeer.internals.initiateParticle(particle, handleTimeout(reject));
        });

        // assert
        const res = await promise;
        expect(res).toBe('test');
    });

    it('Should throw correct message when calling non existing local service', async function () {
        // arrange
        await anotherPeer.start({ connectTo: nodes[0] });

        // act
        const res = callIncorrectService(anotherPeer);

        // assert
        await expect(res).rejects.toMatchObject({
            msg: expect.stringContaining(
                `No handler has been registered for serviceId='incorrect' fnName='incorrect' args=''"'`,
            ),
            instruction: 'call %init_peer_id% ("incorrect" "incorrect") [] res',
        });
    });

    it('Should not crash if undefined is passed as a variable', async () => {
        // arrange;
        await anotherPeer.start();

        // act
        const promise = new Promise<any>((resolve, reject) => {
            const script = `
        (seq
            (call %init_peer_id% ("load" "arg") [] arg)
            (seq
                (call %init_peer_id% ("op" "identity") [arg] res)
                (call %init_peer_id% ("callback" "callback") [res])
            )
        )`;
            const particle = Particle.createNew(script);

            registerHandlersHelper(anotherPeer, particle, {
                load: {
                    arg: (args) => {
                        return undefined;
                    },
                },
                callback: {
                    callback: (args) => {
                        const [val] = args;
                        resolve(val);
                    },
                    error: (args) => {
                        const [error] = args;
                        reject(error);
                    },
                },
            });

            anotherPeer.internals.initiateParticle(particle, handleTimeout(reject));
        });

        // assert
        const res = await promise;
        expect(res).toBe(null);
    });

    it('Should not crash if an error ocurred in user-defined handler', async () => {
        // arrange;
        await anotherPeer.start();

        // act
        const promise = new Promise<any>((resolve, reject) => {
            const script = `
        (xor
            (call %init_peer_id% ("load" "arg") [] arg)
            (call %init_peer_id% ("callback" "error") [%last_error%])
        )`;
            const particle = Particle.createNew(script);

            registerHandlersHelper(anotherPeer, particle, {
                load: {
                    arg: (args) => {
                        throw 'my super custom error message';
                    },
                },
                callback: {
                    error: (args) => {
                        const [error] = args;
                        reject(error);
                    },
                },
            });

            anotherPeer.internals.initiateParticle(particle, handleTimeout(reject));
        });

        // assert
        await expect(promise).rejects.toMatchObject({
            msg: expect.stringContaining('my super custom error message'),
        });
    });

    it('Should throw error if particle is initiated on a stopped peer', async () => {
        // arrange;
        const stoppedPeer = new FluencePeer();

        // act
        const action = () => {
            const script = `(null)`;
            const particle = Particle.createNew(script);

            stoppedPeer.internals.initiateParticle(particle, doNothing);
        };

        // assert
        await expect(action).toThrow('Cannot initiate new particle: peer is not initialized');
    });

    it.skip('Should throw correct error when the client tries to send a particle not to the relay', async () => {
        // arrange;
        await anotherPeer.start({ connectTo: nodes[0] });

        // act
        const promise = new Promise((resolve, reject) => {
            const script = `
    (xor
        (call "incorrect_peer_id" ("any" "service") [])
        (call %init_peer_id% ("callback" "error") [%last_error%])
    )`;
            const particle = Particle.createNew(script);

            registerHandlersHelper(anotherPeer, particle, {
                callback: {
                    error: (args) => {
                        const [error] = args;
                        reject(error);
                    },
                },
            });

            anotherPeer.internals.initiateParticle(particle, doNothing);
        });

        // assert
        await expect(promise).rejects.toMatch(
            'Particle is expected to be sent to only the single peer (relay which client is connected to)',
        );
    });
});

async function callIncorrectService(peer: FluencePeer): Promise<string[]> {
    const promise = new Promise<any[]>((resolve, reject) => {
        const script = `
    (xor
        (call %init_peer_id% ("incorrect" "incorrect") [] res)
        (call %init_peer_id% ("callback" "error") [%last_error%])
    )`;
        const particle = Particle.createNew(script);

        registerHandlersHelper(peer, particle, {
            callback: {
                callback: (args) => {
                    resolve(args);
                },
                error: (args) => {
                    const [error] = args;
                    reject(error);
                },
            },
        });

        peer.internals.initiateParticle(particle, handleTimeout(reject));
    });

    return promise;
}
