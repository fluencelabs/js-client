import { Fluence, FluencePeer } from '../../..';
import { Particle } from '../../../internal/particle';
import { registerHandlersHelper } from '../../util';
import { callMeBack, registerHelloWorld } from './gen1';

describe('Compiler support infrastructure tests', () => {
    it('Compiled code for function should work', async () => {
        // arrange
        await Fluence.start();

        // act
        const res = new Promise((resolve) => {
            callMeBack((arg0, arg1, params) => {
                resolve({
                    arg0: arg0,
                    arg1: arg1,
                    arg0Tetraplet: params.tetraplets.arg0[0], // completion should work here
                    arg1Tetraplet: params.tetraplets.arg1[0], // completion should work here
                });
            });
        });

        // assert
        expect(await res).toMatchObject({
            arg0: 'hello, world',
            arg1: 42,

            arg0Tetraplet: {
                function_name: '',
                json_path: '',
                // peer_pk: '12D3KooWMwDDVRPEn5YGrN5LvVFLjNuBmokaeKfpLUgxsSkqRwwv',
                service_id: '',
            },

            arg1Tetraplet: {
                function_name: '',
                json_path: '',
                // peer_pk: '12D3KooWMwDDVRPEn5YGrN5LvVFLjNuBmokaeKfpLUgxsSkqRwwv',
                service_id: '',
            },
        });

        await Fluence.stop();
    });

    it('Compiled code for service should work', async () => {
        // arrange
        await Fluence.start();

        // act
        const helloPromise = new Promise((resolve) => {
            registerHelloWorld('hello_world', {
                sayHello: (s, params) => {
                    const tetraplet = params.tetraplets.s; // completion should work here
                    resolve(s);
                },
                getNumber: (params) => {
                    // ctx.tetraplets should be {}
                    return 42;
                },
            });
        });

        const getNumberPromise = new Promise<string>((resolve, reject) => {
            const script = `
            (seq
                (seq
                    (call %init_peer_id% ("hello_world" "sayHello") ["hello world!"])
                    (call %init_peer_id% ("hello_world" "getNumber") [] result)
                )
                (call %init_peer_id% ("callback" "callback") [result])
            )`;
            const particle = Particle.createNew(script);
            registerHandlersHelper(Fluence.getPeer(), particle, {
                callback: {
                    callback: (args) => {
                        const [val] = args;
                        resolve(val);
                    },
                },
                _timeout: reject,
            });

            Fluence.getPeer().internals.initiateParticle(particle);
        });

        // assert
        expect(await helloPromise).toBe('hello world!');
        expect(await getNumberPromise).toBe(42);
        await Fluence.stop();
    });

    it('Compiled code for function should work with another peer', async () => {
        // arrange
        const peer = new FluencePeer();
        await peer.start();

        // act
        const res = new Promise((resolve) => {
            callMeBack(peer, (arg0, arg1, params) => {
                resolve({
                    arg0: arg0,
                    arg1: arg1,
                    arg0Tetraplet: params.tetraplets.arg0[0], // completion should work here
                    arg1Tetraplet: params.tetraplets.arg1[0], // completion should work here
                });
            });
        });

        // assert
        expect(await res).toMatchObject({
            arg0: 'hello, world',
            arg1: 42,

            arg0Tetraplet: {
                function_name: '',
                json_path: '',
                // peer_pk: '12D3KooWMwDDVRPEn5YGrN5LvVFLjNuBmokaeKfpLUgxsSkqRwwv',
                service_id: '',
            },

            arg1Tetraplet: {
                function_name: '',
                json_path: '',
                // peer_pk: '12D3KooWMwDDVRPEn5YGrN5LvVFLjNuBmokaeKfpLUgxsSkqRwwv',
                service_id: '',
            },
        });

        await peer.stop();
    });

    it('Compiled code for service should work another peer', async () => {
        // arrange
        const anotherPeer = new FluencePeer();
        await anotherPeer.start();

        // act
        const helloPromise = new Promise((resolve) => {
            registerHelloWorld(anotherPeer, 'hello_world', {
                sayHello: (s, params) => {
                    const tetraplet = params.tetraplets.s; // completion should work here
                    resolve(s);
                },
                getNumber: (params) => {
                    // ctx.tetraplets should be {}
                    return 42;
                },
            });
        });

        const getNumberPromise = new Promise<string>((resolve, reject) => {
            const script = `
            (seq
                (seq
                    (call %init_peer_id% ("hello_world" "sayHello") ["hello world!"])
                    (call %init_peer_id% ("hello_world" "getNumber") [] result)
                )
                (call %init_peer_id% ("callback" "callback") [result])
            )`;
            const particle = Particle.createNew(script);
            registerHandlersHelper(anotherPeer, particle, {
                callback: {
                    callback: (args) => {
                        const [val] = args;
                        resolve(val);
                    },
                },
                _timeout: reject,
            });
            anotherPeer.internals.initiateParticle(particle);
        });

        // assert
        expect(await helloPromise).toBe('hello world!');
        expect(await getNumberPromise).toBe(42);

        await anotherPeer.stop();
    });
});
