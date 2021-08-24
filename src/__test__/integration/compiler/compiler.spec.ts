import { FluencePeer } from '../../..';
import { RequestFlowBuilder } from '../../../internal/RequestFlowBuilder';
import { callMeBack, registerHelloWorld } from './gen1';

describe('Compiler support infrastructure tests', () => {
    it('Compiled code for function should work', async () => {
        // arrange
        await FluencePeer.default.init();

        // act
        const res = new Promise((resolve) => {
            callMeBack(async (arg0, arg1, params) => {
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
    });

    it('Compiled code for service should work', async () => {
        // arrange
        FluencePeer.default.init();

        // act
        const helloPromise = new Promise((resolve) => {
            registerHelloWorld('hello_world', {
                sayHello: async (s, params) => {
                    const tetrapelt = params.tetraplets.s; // completion should work here
                    resolve(s);
                },
                getNumber: async (params) => {
                    // ctx.tetraplets should be {}
                    return 42;
                },
            });
        });

        const [request, getNumberPromise] = new RequestFlowBuilder()
            .withRawScript(
                `(seq
                    (seq
                        (call %init_peer_id% ("hello_world" "sayHello") ["hello world!"])
                        (call %init_peer_id% ("hello_world" "getNumber") [] result)
                    )
                    (call %init_peer_id% ("callback" "callback") [result])
                )`,
            )
            .buildAsFetch<[string]>('callback', 'callback');
        await FluencePeer.default.initiateFlow(request);

        // assert
        expect(await helloPromise).toBe('hello world!');
        expect(await getNumberPromise).toStrictEqual([42]);
    });

    it('Compiled code for function should work2', async () => {
        // arrange
        const peer = new FluencePeer();
        await peer.init();

        // act
        const res = new Promise((resolve) => {
            callMeBack(peer, async (arg0, arg1, params) => {
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
    });

    it('Compiled code for service should work2', async () => {
        // arrange
        const peer = new FluencePeer();
        await peer.init();

        // act
        const helloPromise = new Promise((resolve) => {
            registerHelloWorld(peer, 'hello_world', {
                sayHello: async (s, params) => {
                    const tetrapelt = params.tetraplets.s; // completion should work here
                    resolve(s);
                },
                getNumber: async (params) => {
                    // ctx.tetraplets should be {}
                    return 42;
                },
            });
        });

        const [request, getNumberPromise] = new RequestFlowBuilder()
            .withRawScript(
                `(seq
                    (seq
                        (call %init_peer_id% ("hello_world" "sayHello") ["hello world!"])
                        (call %init_peer_id% ("hello_world" "getNumber") [] result)
                    )
                    (call %init_peer_id% ("callback" "callback") [result])
                )`,
            )
            .buildAsFetch<[string]>('callback', 'callback');
        await peer.initiateFlow(request);

        // assert
        expect(await helloPromise).toBe('hello world!');
        expect(await getNumberPromise).toStrictEqual([42]);
    });
});
