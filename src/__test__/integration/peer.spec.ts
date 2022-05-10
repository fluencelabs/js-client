import { Multiaddr } from 'multiaddr';

import { nodes } from '../connection';
import { FluencePeer } from '../../index';
import { checkConnection, doNothing, handleTimeout } from '../../internal/utils';
import { registerHandlersHelper } from '../util';

let peer: FluencePeer;

describe('Typescript usage suite', () => {
    afterEach(async () => {
        if (peer) {
            await peer.stop();
        }
    });

    beforeEach(() => {
        peer = new FluencePeer();
    });

    it('should perform test for FluencePeer class correctly', () => {
        // arrange
        const number = 1;
        const object = { str: 'Hello!' };
        const undefinedVal = undefined;

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
            const status = peer.getStatus();

            expect(status.isConnected).toBe(false);
            expect(status.isInitialized).toBe(false);
            expect(status.peerId).toBe(null);
            expect(status.relayPeerId).toBe(null);
        });

        it('Should expose correct status for initialized but not connected peer', async () => {
            // arrange
            await peer.start();

            // act
            const status = peer.getStatus();

            // assert
            expect(status.isConnected).toBe(false);
            expect(status.isInitialized).toBe(true);
            expect(status.peerId).not.toBe(null);
            expect(status.relayPeerId).toBe(null);
        });

        it('Should expose correct status for connected peer', async () => {
            // arrange
            await peer.start({ connectTo: nodes[0] });

            // act
            const status = peer.getStatus();

            // assert
            expect(status.isConnected).toBe(true);
            expect(status.isInitialized).toBe(true);
            expect(status.peerId).not.toBe(null);
            expect(status.relayPeerId).not.toBe(null);
        });
    });

    it('should make a call through network', async () => {
        // arrange
        await peer.start({ connectTo: nodes[0] });

        const result = await new Promise<string[]>((resolve, reject) => {
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
            const particle = peer.internals.createNewParticle(script);

            if (particle instanceof Error) {
                return reject(particle.message);
            }

            registerHandlersHelper(peer, particle, {
                load: {
                    relay: () => {
                        return peer.getStatus().relayPeerId;
                    },
                },
                callback: {
                    callback: (args: any) => {
                        const [val] = args;
                        resolve(val);
                    },
                    error: (args: any) => {
                        const [error] = args;
                        reject(error);
                    },
                },
            });

            peer.internals.initiateParticle(particle, handleTimeout(reject));
        });

        expect(result).toBe('hello world!');
    });

    it('check connection should work', async function () {
        await peer.start({ connectTo: nodes[0] });

        const isConnected = await checkConnection(peer);

        expect(isConnected).toEqual(true);
    });

    it('check connection should work with ttl', async function () {
        await peer.start({ connectTo: nodes[0] });

        const isConnected = await checkConnection(peer, 10000);

        expect(isConnected).toEqual(true);
    });

    it('two clients should work inside the same time browser', async () => {
        const peer1 = new FluencePeer();
        await peer1.start({ connectTo: nodes[0] });
        const peer2 = new FluencePeer();
        await peer2.start({ connectTo: nodes[0] });

        const res = new Promise((resolve) => {
            peer2.internals.regHandler.common('test', 'test', (req) => {
                resolve(req.args[0]);
                return {
                    result: {},
                    retCode: 0,
                };
            });
        });

        const script = `
            (seq
                (call "${peer1.getStatus().relayPeerId}" ("op" "identity") [])
                (call "${peer2.getStatus().peerId}" ("test" "test") ["test"])
            )
        `;
        const particle = peer1.internals.createNewParticle(script);

        if (particle instanceof Error) {
            throw particle;
        }

        peer1.internals.initiateParticle(particle, doNothing);

        expect(await res).toEqual('test');

        await peer1.stop();
        await peer2.stop();
    });

    describe('should make connection to network', () => {
        it('address as string', async () => {
            await peer.start({ connectTo: nodes[0].multiaddr });
            const isConnected = await checkConnection(peer);

            expect(isConnected).toBeTruthy();
        });

        it('address as multiaddr', async () => {
            await peer.start({ connectTo: new Multiaddr(nodes[0].multiaddr) });
            const isConnected = await checkConnection(peer);

            expect(isConnected).toBeTruthy();
        });

        it('address as node', async () => {
            await peer.start({ connectTo: nodes[0] });
            const isConnected = await checkConnection(peer);

            expect(isConnected).toBeTruthy();
        });

        it('With connection options: dialTimeout', async () => {
            await peer.start({ connectTo: nodes[0], dialTimeoutMs: 100000 });
            const isConnected = await checkConnection(peer);

            expect(isConnected).toBeTruthy();
        });

        it('With connection options: skipCheckConnection', async () => {
            await peer.start({ connectTo: nodes[0], skipCheckConnection: true });
            const isConnected = await checkConnection(peer);

            expect(isConnected).toBeTruthy();
        });

        it('With connection options: checkConnectionTTL', async () => {
            await peer.start({ connectTo: nodes[0], checkConnectionTimeoutMs: 1000 });
            const isConnected = await checkConnection(peer);

            expect(isConnected).toBeTruthy();
        });

        it('With connection options: defaultTTL', async () => {
            await peer.start({ connectTo: nodes[0], defaultTtlMs: 1 });
            const isConnected = await checkConnection(peer);

            expect(isConnected).toBeFalsy();
        });
    });

    it('Should successfully call identity on local peer', async function () {
        await peer.start();

        const res = await new Promise<string>((resolve, reject) => {
            const script = `
            (seq
                (call %init_peer_id% ("op" "identity") ["test"] res)
                (call %init_peer_id% ("callback" "callback") [res])
            )
            `;
            const particle = peer.internals.createNewParticle(script);

            if (particle instanceof Error) {
                return reject(particle.message);
            }

            registerHandlersHelper(peer, particle, {
                callback: {
                    callback: async (args: any) => {
                        const [res] = args;
                        resolve(res);
                    },
                },
            });

            peer.internals.initiateParticle(particle, handleTimeout(reject));
        });

        expect(res).toBe('test');
    });

    it('Should throw correct message when calling non existing local service', async function () {
        await peer.start({ connectTo: nodes[0] });

        const res = callIncorrectService(peer);

        await expect(res).rejects.toMatchObject({
            message: expect.stringContaining(
                `No handler has been registered for serviceId='incorrect' fnName='incorrect' args='[]'\"'`,
            ),
            // instruction: 'call %init_peer_id% ("incorrect" "incorrect") [] res',
        });
    });

    it('Should not crash if undefined is passed as a variable', async () => {
        await peer.start();

        const res = await new Promise<any>((resolve, reject) => {
            const script = `
        (seq
            (call %init_peer_id% ("load" "arg") [] arg)
            (seq
                (call %init_peer_id% ("op" "identity") [arg] res)
                (call %init_peer_id% ("callback" "callback") [res])
            )
        )`;
            const particle = peer.internals.createNewParticle(script);

            if (particle instanceof Error) {
                return reject(particle.message);
            }

            registerHandlersHelper(peer, particle, {
                load: {
                    arg: () => undefined,
                },
                callback: {
                    callback: (args: any) => {
                        const [val] = args;
                        resolve(val);
                    },
                    error: (args: any) => {
                        const [error] = args;
                        reject(error);
                    },
                },
            });

            peer.internals.initiateParticle(particle, handleTimeout(reject));
        });

        expect(res).toBe(null);
    });

    it('Should not crash if an error ocurred in user-defined handler', async () => {
        await peer.start();

        const promise = new Promise<any>((_resolve, reject) => {
            const script = `
        (xor
            (call %init_peer_id% ("load" "arg") [] arg)
            (call %init_peer_id% ("callback" "error") [%last_error%])
        )`;
            const particle = peer.internals.createNewParticle(script);

            if (particle instanceof Error) {
                return reject(particle.message);
            }

            registerHandlersHelper(peer, particle, {
                load: {
                    arg: () => {
                        throw new Error('my super custom error message');
                    },
                },
                callback: {
                    error: (args: any) => {
                        const [error] = args;
                        reject(error);
                    },
                },
            });

            peer.internals.initiateParticle(particle, handleTimeout(reject));
        });

        await expect(promise).rejects.toMatchObject({
            message: expect.stringContaining('my super custom error message'),
        });
    });

    it('Should return error if particle is created on a stopped peer', async () => {
        await peer.stop();
        const particle = peer.internals.createNewParticle(`(null)`);

        expect(particle instanceof Error).toBe(true);
    });

    it.skip('Should throw correct error when the client tries to send a particle not to the relay', async () => {
        await peer.start({ connectTo: nodes[0] });

        const promise = new Promise((resolve, reject) => {
            const script = `
    (xor
        (call "incorrect_peer_id" ("any" "service") [])
        (call %init_peer_id% ("callback" "error") [%last_error%])
    )`;
            const particle = peer.internals.createNewParticle(script);

            if (particle instanceof Error) {
                return reject(particle.message);
            }

            registerHandlersHelper(peer, particle, {
                callback: {
                    error: (args: any) => {
                        const [error] = args;
                        reject(error);
                    },
                },
            });

            peer.internals.initiateParticle(particle, doNothing);
        });

        await expect(promise).rejects.toMatch(
            'Particle is expected to be sent to only the single peer (relay which client is connected to)',
        );
    });
});

async function callIncorrectService(peer: FluencePeer): Promise<string[]> {
    return new Promise<any[]>((resolve, reject) => {
        const script = `
    (xor
        (call %init_peer_id% ("incorrect" "incorrect") [] res)
        (call %init_peer_id% ("callback" "error") [%last_error%])
    )`;
        const particle = peer.internals.createNewParticle(script);

        if (particle instanceof Error) {
            return reject(particle.message);
        }

        registerHandlersHelper(peer, particle, {
            callback: {
                callback: (args: any) => {
                    resolve(args);
                },
                error: (args: any) => {
                    const [error] = args;
                    reject(error);
                },
            },
        });

        peer.internals.initiateParticle(particle, handleTimeout(reject));
    });
}
