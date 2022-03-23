/**
 *
 * This file is auto-generated. Do not edit manually: changes may be erased.
 * Generated by Aqua compiler: https://github.com/fluencelabs/aqua/.
 * If you find any bugs, please write an issue on GitHub: https://github.com/fluencelabs/aqua/issues
 * Aqua version: 0.7.0-285
 *
 */
import { Fluence, FluencePeer } from '../../index';
import { CallParams, callFunction, registerService } from '../../internal/compilerSupport/v3';

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
        functions: {
            tag: 'labeledProduct',
            fields: {
                provide_data: {
                    tag: 'arrow',
                    domain: {
                        tag: 'nil',
                    },
                    codomain: {
                        tag: 'unlabeledProduct',
                        items: [
                            {
                                tag: 'array',
                                type: {
                                    tag: 'scalar',
                                    name: 'u8',
                                },
                            },
                        ],
                    },
                },
            },
        },
    });
}

export interface SigDef {
    get_pub_key: (callParams: CallParams<null>) => string | Promise<string>;
    sign: (
        data: number[],
        callParams: CallParams<'data'>,
    ) =>
        | { error: string | null; signature: number[] | null; success: boolean }
        | Promise<{ error: string | null; signature: number[] | null; success: boolean }>;
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
        functions: {
            tag: 'labeledProduct',
            fields: {
                get_pub_key: {
                    tag: 'arrow',
                    domain: {
                        tag: 'nil',
                    },
                    codomain: {
                        tag: 'unlabeledProduct',
                        items: [
                            {
                                tag: 'scalar',
                                name: 'string',
                            },
                        ],
                    },
                },
                sign: {
                    tag: 'arrow',
                    domain: {
                        tag: 'labeledProduct',
                        fields: {
                            data: {
                                tag: 'array',
                                type: {
                                    tag: 'scalar',
                                    name: 'u8',
                                },
                            },
                        },
                    },
                    codomain: {
                        tag: 'unlabeledProduct',
                        items: [
                            {
                                tag: 'struct',
                                name: 'SignResult',
                                fields: {
                                    error: {
                                        tag: 'option',
                                        type: {
                                            tag: 'scalar',
                                            name: 'string',
                                        },
                                    },
                                    signature: {
                                        tag: 'option',
                                        type: {
                                            tag: 'array',
                                            type: {
                                                tag: 'scalar',
                                                name: 'u8',
                                            },
                                        },
                                    },
                                    success: {
                                        tag: 'scalar',
                                        name: 'bool',
                                    },
                                },
                            },
                        ],
                    },
                },
                verify: {
                    tag: 'arrow',
                    domain: {
                        tag: 'labeledProduct',
                        fields: {
                            signature: {
                                tag: 'array',
                                type: {
                                    tag: 'scalar',
                                    name: 'u8',
                                },
                            },
                            data: {
                                tag: 'array',
                                type: {
                                    tag: 'scalar',
                                    name: 'u8',
                                },
                            },
                        },
                    },
                    codomain: {
                        tag: 'unlabeledProduct',
                        items: [
                            {
                                tag: 'scalar',
                                name: 'bool',
                            },
                        ],
                    },
                },
            },
        },
    });
}

// Functions

export type CallSigResult = { error: string | null; signature: number[] | null; success: boolean };
export function callSig(sigId: string, config?: { ttl?: number }): Promise<CallSigResult>;

export function callSig(peer: FluencePeer, sigId: string, config?: { ttl?: number }): Promise<CallSigResult>;

export function callSig(...args: any) {
    let script = `
                    (xor
                     (seq
                      (seq
                       (seq
                        (seq
                         (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
                         (call %init_peer_id% ("getDataSrv" "sigId") [] sigId)
                        )
                        (call %init_peer_id% ("data" "provide_data") [] data)
                       )
                       (call %init_peer_id% (sigId "sign") [data] signature)
                      )
                      (xor
                       (call %init_peer_id% ("callbackSrv" "response") [signature])
                       (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 1])
                      )
                     )
                     (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 2])
                    )
    `;
    return callFunction(
        args,
        {
            functionName: 'callSig',
            arrow: {
                tag: 'arrow',
                domain: {
                    tag: 'labeledProduct',
                    fields: {
                        sigId: {
                            tag: 'scalar',
                            name: 'string',
                        },
                    },
                },
                codomain: {
                    tag: 'unlabeledProduct',
                    items: [
                        {
                            tag: 'struct',
                            name: 'SignResult',
                            fields: {
                                error: {
                                    tag: 'option',
                                    type: {
                                        tag: 'scalar',
                                        name: 'string',
                                    },
                                },
                                signature: {
                                    tag: 'option',
                                    type: {
                                        tag: 'array',
                                        type: {
                                            tag: 'scalar',
                                            name: 'u8',
                                        },
                                    },
                                },
                                success: {
                                    tag: 'scalar',
                                    name: 'bool',
                                },
                            },
                        },
                    ],
                },
            },
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
