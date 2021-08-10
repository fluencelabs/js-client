import { ResultCodes, RequestFlow, RequestFlowBuilder, CallParams } from '../../../internal/compilerSupport/v1';
import { FluencePeer } from '../../../index';

/*

-- file to generate functions below from

service HelloWorld:
    sayHello(s: string)
    getNumber() -> i32

func callMeBack(callback: string, i32 -> ()):
    callback("hello, world", 42)

*/

const registerHelloWorldImpl = (peer: FluencePeer) => {
    return (
        options: { serviceId: string },
        service: {
            sayHello: (s: string, callParams: CallParams<'s'>) => void;
            getNumber: (callParams: CallParams<null>) => number;
        },
    ) => {
        peer.callServiceHandler.use((req, resp, next) => {
            if (req.serviceId !== options.serviceId) {
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
    };
};

const callMeBackImpl = (peer: FluencePeer) => {
    return async (
        callback: (arg0: string, arg1: number, callParams: CallParams<'arg0' | 'arg1'>) => void,
        config?: { ttl?: number },
    ): Promise<void> => {
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
                        return FluencePeer.default.connectionInfo.connectedRelays[0];
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
        await peer.initiateFlow(request!);
        return Promise.race([promise, Promise.resolve()]);
    };
};

export const registerHelloWorld = registerHelloWorldImpl(FluencePeer.default);

export const callMeBack = callMeBackImpl(FluencePeer.default);

declare module '../../../index' {
    interface FluencePeer {
        registerHelloWorld: (
            options: { serviceId: string },
            service: {
                sayHello: (s: string, callParams: CallParams<'s'>) => void;
                getNumber: (callParams: CallParams<null>) => number;
            },
        ) => void;
        callMeBack: (
            callback: (arg0: string, arg1: number, callParams: CallParams<'arg0' | 'arg1'>) => void,
            config?: { ttl?: number },
        ) => Promise<void>;
    }
}

FluencePeer.prototype.registerHelloWorld = function (...args) {
    return registerHelloWorldImpl(this)(...args);
};

FluencePeer.prototype.callMeBack = function (...args) {
    return callMeBackImpl(this)(...args);
};
