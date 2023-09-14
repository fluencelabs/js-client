import { it, describe, expect } from 'vitest';

import { isFluencePeer } from '../../api.js';
import { mkTestPeer, registerHandlersHelper, withPeer } from '../../util/testUtils.js';
import { handleTimeout } from '../../particle/Particle.js';
import { FluencePeer } from '../FluencePeer.js';

describe('FluencePeer usage test suite', () => {
    it('should perform test for FluencePeer class correctly', async () => {
        // arrange
        const peer = await mkTestPeer();
        const number = 1;
        const object = { str: 'Hello!' };
        const undefinedVal = undefined;

        // act
        const isPeerPeer = isFluencePeer(peer);
        const isNumberPeer = isFluencePeer(number);
        const isObjectPeer = isFluencePeer(object);
        const isUndefinedPeer = isFluencePeer(undefinedVal);

        // act
        expect(isPeerPeer).toBe(true);
        expect(isNumberPeer).toBe(false);
        expect(isObjectPeer).toBe(false);
        expect(isUndefinedPeer).toBe(false);
    });

    it('Should successfully call identity on local peer', async function () {
        await withPeer(async (peer) => {
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
    });

    it('Should throw correct message when calling non existing local service', async function () {
        await withPeer(async (peer) => {
            const res = callIncorrectService(peer);

            await expect(res).rejects.toMatchObject({
                message: expect.stringContaining(
                    `"No service found for service call: serviceId='incorrect', fnName='incorrect' args='[]'"`,
                ),
                instruction: 'call %init_peer_id% ("incorrect" "incorrect") [] res',
            });
        });
    });

    it('Should not crash if undefined is passed as a variable', async () => {
        await withPeer(async (peer) => {
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
    });

    it('Should not crash if an error ocurred in user-defined handler', async () => {
        await withPeer(async (peer) => {
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
