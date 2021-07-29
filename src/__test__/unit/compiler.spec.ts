import { SecurityTetraplet } from '@fluencelabs/avm';
import { createClient, FluenceClient } from '../../FluenceClient';
import { ResultCodes } from '../../internal/CallServiceHandler';
import { RequestFlow } from '../../internal/RequestFlow';
import { RequestFlowBuilder } from '../../internal/RequestFlowBuilder';
import { CallParams } from '../../internal/compilerSupport';

describe('Compiler support infrastructure tests', () => {
    it('Compiled code for function should work', async () => {
        // arrange
        const client = await createClient();

        // act
        const res = new Promise((resolve) => {
            callMeBack(client, (arg0, arg1, ctx) => {
                resolve({
                    arg0: arg0,
                    arg1: arg1,
                    ctx: ctx,
                });
            });
        });

        // assert
        expect(await res).toMatchObject({
            arg0: 'hello, world',
            arg1: 42,
            ctx: {
                initPeerId: client.selfPeerId,
                // particleId: '844586c3-6e91-4028-a200-e7107107e346',
                signature: '',
                tetraplets: {
                    arg0: [
                        {
                            function_name: '',
                            json_path: '',
                            // peer_pk: '12D3KooWMwDDVRPEn5YGrN5LvVFLjNuBmokaeKfpLUgxsSkqRwwv',
                            service_id: '',
                        },
                    ],
                    arg1: [
                        {
                            function_name: '',
                            json_path: '',
                            // peer_pk: '12D3KooWMwDDVRPEn5YGrN5LvVFLjNuBmokaeKfpLUgxsSkqRwwv',
                            service_id: '',
                        },
                    ],
                },
                // timeStamp: 1627555380988,
                // ttl: 7000,
            },
        });
    });

    it('Compiled code for service should work', async () => {
        // arrange
        const client = await createClient();

        // act
        const helloPromise = new Promise((resolve) => {
            registerHelloWorld(client, 'hello_world', {
                sayHello: (s, ctx) => {
                    resolve(s);
                },
                getNumber: (ctx) => {
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
        await client.initiateFlow(request);

        // assert
        expect(await helloPromise).toBe('hello world!');
        expect(await getNumberPromise).toStrictEqual([42]);
    });
});

/*

-- file to generate functions below from

service HelloWorld:
    sayHello(s: string)
    getNumber() -> i32

func callMeBack(callback: string, i32 -> ()):
    callback("hello, world", 42)

*/

function registerHelloWorld(
    client: FluenceClient,
    id: string,
    service: {
        sayHello: (s: string, callParams: CallParams & { tetraplets: { s: SecurityTetraplet[] } }) => void;
        getNumber: (callParams: CallParams & { tetraplets: {} }) => number;
    },
) {
    client.callServiceHandler.use((req, resp, next) => {
        if (req.serviceId !== id) {
            next();
            return;
        }

        if (req.fnName === 'sayHello') {
            const callParams = {
                ...req.particleContext,
                tetraplets: {
                    s: req.tetraplets[0],
                },
            };
            const res = service.sayHello(req.args[0], callParams);
            resp.retCode = ResultCodes.success;
            resp.result = null;
        }

        if (req.fnName === 'getNumber') {
            const callParams = {
                ...req.particleContext,
                tetraplets: {},
            };
            const res = service.getNumber(callParams);
            resp.retCode = ResultCodes.success;
            resp.result = res;
        }

        next();
    });
}

async function callMeBack(
    client: FluenceClient,
    callback: (
        arg0: string,
        arg1: number,
        callParams: CallParams & { tetraplets: { arg0: SecurityTetraplet[]; arg1: SecurityTetraplet[] } },
    ) => void,
    config?: { ttl?: number },
): Promise<void> {
    let request: RequestFlow;
    const promise = new Promise<void>((resolve, reject) => {
        const r = new RequestFlowBuilder()
            .disableInjections()
            .withRawScript(
                `
(xor
 (seq
  (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
  (xor
   (call %init_peer_id% ("callbackSrv" "callback") ["hello, world" 42])
   (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 1])
  )
 )
 (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 2])
)

            `,
            )
            .configHandler((h) => {
                h.on('getDataSrv', '-relay-', () => {
                    return client.relayPeerId!;
                });

                h.use((req, resp, next) => {
                    if (req.serviceId === 'callbackSrv' && req.fnName === 'callback') {
                        const callParams = {
                            ...req.particleContext,
                            tetraplets: {
                                arg0: req.tetraplets[0],
                                arg1: req.tetraplets[1],
                            },
                        };
                        const res = callback(req.args[0], req.args[1], callParams);
                        resp.retCode = ResultCodes.success;
                        resp.result = {};
                    }
                    next();
                });

                h.onEvent('errorHandlingSrv', 'error', (args) => {
                    // assuming error is the single argument
                    const [err] = args;
                    reject(err);
                });
            })
            .handleScriptError(reject)
            .handleTimeout(() => {
                reject('Request timed out for callMeBack');
            });
        if (config?.ttl) {
            r.withTTL(config.ttl);
        }
        request = r.build();
    });
    await client.initiateFlow(request!);
    return Promise.race([promise, Promise.resolve()]);
}
