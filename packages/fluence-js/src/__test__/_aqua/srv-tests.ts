/**
 *
 * This file is auto-generated. Do not edit manually: changes may be erased.
 * Generated by Aqua compiler: https://github.com/fluencelabs/aqua/.
 * If you find any bugs, please write an issue on GitHub: https://github.com/fluencelabs/aqua/issues
 * Aqua version: 0.7.7-362
 *
 */
import { FluencePeer } from '../../index';
import { callFunction$$ } from '../../internal/compilerSupport/v4';

// Services

// Functions

export function happy_path(file_path: string, config?: { ttl?: number }): Promise<string>;

export function happy_path(peer: FluencePeer, file_path: string, config?: { ttl?: number }): Promise<string>;

export function happy_path(...args: any) {
    let script = `
                    (xor
                     (seq
                      (seq
                       (seq
                        (seq
                         (seq
                          (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
                          (call %init_peer_id% ("getDataSrv" "file_path") [] file_path)
                         )
                         (call %init_peer_id% ("node_utils" "read_file") [file_path] file)
                        )
                        (call %init_peer_id% ("single_module_srv" "create") [file.$.content.[0]!] created_service)
                       )
                       (call %init_peer_id% (created_service.$.service_id.[0]! "greeting") ["test"] greeting)
                      )
                      (xor
                       (call %init_peer_id% ("callbackSrv" "response") [greeting])
                       (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 1])
                      )
                     )
                     (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 2])
                    )
    `;
    return callFunction$$(
        args,
        {
            functionName: 'happy_path',
            arrow: {
                tag: 'arrow',
                domain: {
                    tag: 'labeledProduct',
                    fields: {
                        file_path: {
                            tag: 'scalar',
                            name: 'string',
                        },
                    },
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

export function removing_non_exiting(config?: { ttl?: number }): Promise<string>;

export function removing_non_exiting(peer: FluencePeer, config?: { ttl?: number }): Promise<string>;

export function removing_non_exiting(...args: any) {
    let script = `
                    (xor
                     (seq
                      (seq
                       (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
                       (call %init_peer_id% ("single_module_srv" "remove") ["random_id"] e)
                      )
                      (xor
                       (call %init_peer_id% ("callbackSrv" "response") [e.$.error.[0]!])
                       (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 1])
                      )
                     )
                     (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 2])
                    )
    `;
    return callFunction$$(
        args,
        {
            functionName: 'removing_non_exiting',
            arrow: {
                tag: 'arrow',
                domain: {
                    tag: 'labeledProduct',
                    fields: {},
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

export function file_not_found(config?: { ttl?: number }): Promise<string>;

export function file_not_found(peer: FluencePeer, config?: { ttl?: number }): Promise<string>;

export function file_not_found(...args: any) {
    let script = `
                    (xor
                     (seq
                      (seq
                       (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
                       (call %init_peer_id% ("node_utils" "read_file") ["/random/incorrect/file"] e)
                      )
                      (xor
                       (call %init_peer_id% ("callbackSrv" "response") [e.$.error.[0]!])
                       (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 1])
                      )
                     )
                     (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 2])
                    )
    `;
    return callFunction$$(
        args,
        {
            functionName: 'file_not_found',
            arrow: {
                tag: 'arrow',
                domain: {
                    tag: 'labeledProduct',
                    fields: {},
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

export function service_removed(file_path: string, config?: { ttl?: number }): Promise<string>;

export function service_removed(peer: FluencePeer, file_path: string, config?: { ttl?: number }): Promise<string>;

export function service_removed(...args: any) {
    let script = `
                    (xor
                     (seq
                      (seq
                       (seq
                        (seq
                         (seq
                          (seq
                           (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
                           (call %init_peer_id% ("getDataSrv" "file_path") [] file_path)
                          )
                          (call %init_peer_id% ("node_utils" "read_file") [file_path] file)
                         )
                         (call %init_peer_id% ("single_module_srv" "create") [file.$.content.[0]!] created_service)
                        )
                        (call %init_peer_id% ("single_module_srv" "remove") [created_service.$.service_id.[0]!])
                       )
                       (xor
                        (call %init_peer_id% (created_service.$.service_id.[0]! "greeting") ["test"] dontcare)
                        (null)
                       )
                      )
                      (xor
                       (call %init_peer_id% ("callbackSrv" "response") [%last_error%.$.message!])
                       (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 1])
                      )
                     )
                     (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 2])
                    )
    `;
    return callFunction$$(
        args,
        {
            functionName: 'service_removed',
            arrow: {
                tag: 'arrow',
                domain: {
                    tag: 'labeledProduct',
                    fields: {
                        file_path: {
                            tag: 'scalar',
                            name: 'string',
                        },
                    },
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

export function list_services(file_path: string, config?: { ttl?: number }): Promise<string[]>;

export function list_services(peer: FluencePeer, file_path: string, config?: { ttl?: number }): Promise<string[]>;

export function list_services(...args: any) {
    let script = `
                    (xor
                     (seq
                      (seq
                       (seq
                        (seq
                         (seq
                          (seq
                           (seq
                            (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
                            (call %init_peer_id% ("getDataSrv" "file_path") [] file_path)
                           )
                           (call %init_peer_id% ("node_utils" "read_file") [file_path] file)
                          )
                          (call %init_peer_id% ("single_module_srv" "create") [file.$.content.[0]!])
                         )
                         (call %init_peer_id% ("single_module_srv" "create") [file.$.content.[0]!])
                        )
                        (call %init_peer_id% ("single_module_srv" "create") [file.$.content.[0]!])
                       )
                       (call %init_peer_id% ("single_module_srv" "list") [] list)
                      )
                      (xor
                       (call %init_peer_id% ("callbackSrv" "response") [list])
                       (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 1])
                      )
                     )
                     (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 2])
                    )
    `;
    return callFunction$$(
        args,
        {
            functionName: 'list_services',
            arrow: {
                tag: 'arrow',
                domain: {
                    tag: 'labeledProduct',
                    fields: {
                        file_path: {
                            tag: 'scalar',
                            name: 'string',
                        },
                    },
                },
                codomain: {
                    tag: 'unlabeledProduct',
                    items: [
                        {
                            tag: 'array',
                            type: {
                                tag: 'scalar',
                                name: 'string',
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