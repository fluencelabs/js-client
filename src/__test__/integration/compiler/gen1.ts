import { ResultCodes, RequestFlow, RequestFlowBuilder, CallParams } from '../../../internal/compilerSupport/v1';
import { FluencePeer } from '../../../index';

/*

-- file to generate functions below from

service HelloWorld("default"):
    sayHello(s: string)
    getNumber() -> i32

func callMeBack(callback: string, i32 -> ()):
    callback("hello, world", 42)

*/

export function registerHelloWorld(
    // new line
    service: {
        sayHello: (s: string, callParams: CallParams<'s'>) => void;
        getNumber: (callParams: CallParams<null>) => number;
    },
): void;
export function registerHelloWorld(
    serviceId: string,
    service: {
        sayHello: (s: string, callParams: CallParams<'s'>) => void;
        getNumber: (callParams: CallParams<null>) => number;
    },
): void;
export function registerHelloWorld(
    // new line
    peer: FluencePeer,
    service: {
        sayHello: (s: string, callParams: CallParams<'s'>) => void;
        getNumber: (callParams: CallParams<null>) => number;
    },
): void;
export function registerHelloWorld(
    peer: FluencePeer,
    serviceId: string,
    service: {
        sayHello: (s: string, callParams: CallParams<'s'>) => void;
        getNumber: (callParams: CallParams<null>) => number;
    },
): void;
export function registerHelloWorld(...args) {
    let peer: FluencePeer;
    let serviceId;
    let service;
    if (args[0] instanceof FluencePeer) {
        peer = args[0];
    } else {
        peer = FluencePeer.default;
    }

    if (typeof args[0] === 'number') {
        serviceId = args[0];
    } else if (typeof args[1] === 'number') {
        serviceId = args[1];
    } else {
        serviceId = 'default';
    }

    if (typeof args[0] === 'object') {
        service = args[0];
    } else if (typeof args[1] === 'object') {
        service = args[1];
    } else {
        service = args[2];
    }

    peer.callServiceHandler.use((req, resp, next) => {
        if (req.serviceId !== serviceId) {
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

export async function callMeBack(
    callback: (arg0: string, arg1: number, callParams: CallParams<'arg0' | 'arg1'>) => void,
    config?: { ttl?: number },
): Promise<void>;
export async function callMeBack(
    peer: FluencePeer,
    callback: (arg0: string, arg1: number, callParams: CallParams<'arg0' | 'arg1'>) => void,
    config?: { ttl?: number },
): Promise<void>;
export async function callMeBack(...args) {
    let peer: FluencePeer;
    let callback;
    let config;
    if (args[0] instanceof FluencePeer) {
        peer = args[0];
        callback = args[1];
        config = args[2];
    } else {
        peer = FluencePeer.default;
        callback = args[0];
        config = args[1];
    }

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
}
