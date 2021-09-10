import { ResultCodes, RequestFlow, RequestFlowBuilder, CallParams } from '../../../internal/compilerSupport/v1';
import Fluence, { FluencePeer } from '../../../index';

/*

-- file to generate functions below from

service HelloWorld("default"):
    sayHello(s: string)
    getNumber() -> i32

func callMeBack(callback: string, i32 -> ()):
    callback("hello, world", 42)

*/

/**
 *
 * This file is auto-generated. Do not edit manually: changes may be erased.
 * Generated by Aqua compiler: https://github.com/fluencelabs/aqua/.
 * If you find any bugs, please write an issue on GitHub: https://github.com/fluencelabs/aqua/issues
 * Aqua version: 0.2.2-SNAPSHOT
 *
 */

// Services

export interface HelloWorldDef {
    getNumber: (callParams: CallParams<null>) => number;
    sayHello: (s: string, callParams: CallParams<'s'>) => void;
}

export function registerHelloWorld(service: HelloWorldDef): void;
export function registerHelloWorld(serviceId: string, service: HelloWorldDef): void;
export function registerHelloWorld(peer: FluencePeer, service: HelloWorldDef): void;
export function registerHelloWorld(peer: FluencePeer, serviceId: string, service: HelloWorldDef): void;
export function registerHelloWorld(...args) {
    let peer: FluencePeer;
    let serviceId;
    let service;
    if (args[0] instanceof FluencePeer) {
        peer = args[0];
    } else {
        peer = Fluence.getPeer();
    }

    if (typeof args[0] === 'string') {
        serviceId = args[0];
    } else if (typeof args[1] === 'string') {
        serviceId = args[1];
    } else {
        serviceId = 'default';
    }

    if (!(args[0] instanceof FluencePeer) && typeof args[0] === 'object') {
        service = args[0];
    } else if (typeof args[1] === 'object') {
        service = args[1];
    } else {
        service = args[2];
    }

    peer.internals.callServiceHandler.use((req, resp, next) => {
        if (req.serviceId !== serviceId) {
            next();
            return;
        }

        if (req.fnName === 'getNumber') {
            const callParams = {
                ...req.particleContext,
                tetraplets: {},
            };
            resp.retCode = ResultCodes.success;
            resp.result = service.getNumber(callParams);
        }

        if (req.fnName === 'sayHello') {
            const callParams = {
                ...req.particleContext,
                tetraplets: {
                    s: req.tetraplets[0],
                },
            };
            resp.retCode = ResultCodes.success;
            service.sayHello(req.args[0], callParams);
            resp.result = {};
        }

        next();
    });
}

// Functions

export function callMeBack(
    callback: (arg0: string, arg1: number, callParams: CallParams<'arg0' | 'arg1'>) => void,
    config?: { ttl?: number },
): Promise<void>;
export function callMeBack(
    peer: FluencePeer,
    callback: (arg0: string, arg1: number, callParams: CallParams<'arg0' | 'arg1'>) => void,
    config?: { ttl?: number },
): Promise<void>;
export function callMeBack(...args) {
    let peer: FluencePeer;
    let callback;
    let config;
    if (args[0] instanceof FluencePeer) {
        peer = args[0];
        callback = args[1];
        config = args[2];
    } else {
        peer = Fluence.getPeer();
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
                    return peer.getStatus().relayPeerId || null;
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
                        resp.retCode = ResultCodes.success;
                        callback(req.args[0], req.args[1], callParams);
                        resp.result = {};
                    }
                    next();
                });

                h.onEvent('callbackSrv', 'response', (args) => {});

                h.onEvent('errorHandlingSrv', 'error', (args) => {
                    const [err] = args;
                    reject(err);
                });
            })
            .handleScriptError(reject)
            .handleTimeout(() => {
                reject('Request timed out for callMeBack');
            });
        if (config && config.ttl) {
            r.withTTL(config.ttl);
        }
        request = r.build();
    });
    peer.internals.initiateFlow(request!);
    return Promise.race([promise, Promise.resolve()]);
}
