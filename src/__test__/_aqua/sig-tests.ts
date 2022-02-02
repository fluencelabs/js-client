/**
 *
 * This file is auto-generated. Do not edit manually: changes may be erased.
 * Generated by Aqua compiler: https://github.com/fluencelabs/aqua/.
 * If you find any bugs, please write an issue on GitHub: https://github.com/fluencelabs/aqua/issues
 * Aqua version: 0.5.3-258
 *
 */
import { Fluence, FluencePeer } from '../../';
import { CallParams, callFunction, registerService } from '../../internal/compilerSupport/v2';

// Services

export interface DataProviderDef {
    provide_data: (callParams: CallParams<null>) => number[] | Promise<number[]>;
}
export function registerDataProvider(service: DataProviderDef): void;
export function registerDataProvider(serviceId: string, service: DataProviderDef): void;
export function registerDataProvider(peer: FluencePeer, service: DataProviderDef): void;
export function registerDataProvider(peer: FluencePeer, serviceId: string, service: DataProviderDef): void;

export function registerDataProvider(...args: any) {
    registerService(args, {
        defaultServiceId: 'data',
        functions: [
            {
                functionName: 'provide_data',
                argDefs: [],
                returnType: {
                    tag: 'primitive',
                },
            },
        ],
    });
}

export interface SigDef {
    get_pub_key: (callParams: CallParams<null>) => string | Promise<string>;
    sign: (data: number[], callParams: CallParams<'data'>) => number[] | Promise<number[]>;
    verify: (
        signature: number[],
        data: number[],
        callParams: CallParams<'signature' | 'data'>,
    ) => boolean | Promise<boolean>;
}
export function registerSig(service: SigDef): void;
export function registerSig(serviceId: string, service: SigDef): void;
export function registerSig(peer: FluencePeer, service: SigDef): void;
export function registerSig(peer: FluencePeer, serviceId: string, service: SigDef): void;

export function registerSig(...args: any) {
    registerService(args, {
        defaultServiceId: 'sig',
        functions: [
            {
                functionName: 'get_pub_key',
                argDefs: [],
                returnType: {
                    tag: 'primitive',
                },
            },
            {
                functionName: 'sign',
                argDefs: [
                    {
                        name: 'data',
                        argType: {
                            tag: 'primitive',
                        },
                    },
                ],
                returnType: {
                    tag: 'primitive',
                },
            },
            {
                functionName: 'verify',
                argDefs: [
                    {
                        name: 'signature',
                        argType: {
                            tag: 'primitive',
                        },
                    },
                    {
                        name: 'data',
                        argType: {
                            tag: 'primitive',
                        },
                    },
                ],
                returnType: {
                    tag: 'primitive',
                },
            },
        ],
    });
}

// Functions

export function callSig(
    sigId: string,
    success: (arg0: number[], callParams: CallParams<'arg0'>) => void | Promise<void>,
    failure: (arg0: string, callParams: CallParams<'arg0'>) => void | Promise<void>,
    config?: { ttl?: number },
): Promise<string>;

export function callSig(
    peer: FluencePeer,
    sigId: string,
    success: (arg0: number[], callParams: CallParams<'arg0'>) => void | Promise<void>,
    failure: (arg0: string, callParams: CallParams<'arg0'>) => void | Promise<void>,
    config?: { ttl?: number },
): Promise<string>;

export function callSig(...args: any) {
    let script = `
                    (xor
                     (seq
                      (seq
                       (seq
                        (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
                        (call %init_peer_id% ("getDataSrv" "sigId") [] sigId)
                       )
                       (xor
                        (seq
                         (seq
                          (call %init_peer_id% ("data" "provide_data") [] data)
                          (call %init_peer_id% (sigId "sign") [data] signature)
                         )
                         (xor
                          (call %init_peer_id% ("callbackSrv" "success") [signature])
                          (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 1])
                         )
                        )
                        (xor
                         (call %init_peer_id% ("callbackSrv" "failure") [%last_error%.$.message!])
                         (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 2])
                        )
                       )
                      )
                      (xor
                       (call %init_peer_id% ("callbackSrv" "response") ["finished"])
                       (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 3])
                      )
                     )
                     (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 4])
                    )
    `;
    return callFunction(
        args,
        {
            functionName: 'callSig',
            returnType: {
                tag: 'primitive',
            },
            argDefs: [
                {
                    name: 'sigId',
                    argType: {
                        tag: 'primitive',
                    },
                },
                {
                    name: 'success',
                    argType: {
                        tag: 'callback',
                        callback: {
                            argDefs: [
                                {
                                    name: 'arg0',
                                    argType: {
                                        tag: 'primitive',
                                    },
                                },
                            ],
                            returnType: {
                                tag: 'void',
                            },
                        },
                    },
                },
                {
                    name: 'failure',
                    argType: {
                        tag: 'callback',
                        callback: {
                            argDefs: [
                                {
                                    name: 'arg0',
                                    argType: {
                                        tag: 'primitive',
                                    },
                                },
                            ],
                            returnType: {
                                tag: 'void',
                            },
                        },
                    },
                },
            ],
            names: {
                relay: '-relay-',
                getDataSrv: 'getDataSrv',
                callbackSrv: 'callbackSrv',
                responseSrv: 'callbackSrv',
                responseFnName: 'response',
                errorHandlingSrv: 'errorHandlingSrv',
                errorFnName: 'error',
            },
        },
        script,
    );
}
