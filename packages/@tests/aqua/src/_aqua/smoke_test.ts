/* eslint-disable */
// @ts-nocheck
/**
 *
 * This file is auto-generated. Do not edit manually: changes may be erased.
 * Generated by Aqua compiler: https://github.com/fluencelabs/aqua/.
 * If you find any bugs, please write an issue on GitHub: https://github.com/fluencelabs/aqua/issues
 * Aqua version: 0.9.4
 *
 */
import type { IFluenceClient as IFluenceClient$$, CallParams as CallParams$$ } from '@fluencelabs/js-client.api';
import { v5_callFunction as callFunction$$, v5_registerService as registerService$$ } from '@fluencelabs/js-client.api';

// Services

export interface HelloWorldDef {
    hello: (str: string, callParams: CallParams$$<'str'>) => string | Promise<string>;
}
export function registerHelloWorld(service: HelloWorldDef): void;
export function registerHelloWorld(serviceId: string, service: HelloWorldDef): void;
export function registerHelloWorld(peer: IFluenceClient$$, service: HelloWorldDef): void;
export function registerHelloWorld(peer: IFluenceClient$$, serviceId: string, service: HelloWorldDef): void;

export function registerHelloWorld(...args: any) {
    registerService$$(args, {
        defaultServiceId: 'hello-world',
        functions: {
            tag: 'labeledProduct',
            fields: {
                hello: {
                    tag: 'arrow',
                    domain: {
                        tag: 'labeledProduct',
                        fields: {
                            str: {
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
            },
        },
    });
}

// Functions

export type SmokeTestResult = [string | null, string[], string];
export function smokeTest(label: string, config?: { ttl?: number }): Promise<SmokeTestResult>;

export function smokeTest(peer: IFluenceClient$$, label: string, config?: { ttl?: number }): Promise<SmokeTestResult>;

export function smokeTest(...args: any) {
    let script = `
                    (xor
                     (seq
                      (seq
                       (seq
                        (seq
                         (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
                         (call %init_peer_id% ("getDataSrv" "label") [] label)
                        )
                        (new $resource_id
                         (new $successful
                          (seq
                           (seq
                            (seq
                             (call %init_peer_id% ("peer" "timestamp_sec") [] t)
                             (xor
                              (seq
                               (seq
                                (call -relay- ("registry" "get_key_bytes") [label [] t [] ""] bytes)
                                (xor
                                 (call %init_peer_id% ("sig" "sign") [bytes] result)
                                 (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 1])
                                )
                               )
                               (xor
                                (match result.$.success! false
                                 (ap result.$.error.[0]! $error)
                                )
                                (seq
                                 (seq
                                  (seq
                                   (seq
                                    (seq
                                     (seq
                                      (ap result.$.signature! result_flat)
                                      (call -relay- ("registry" "get_key_id") [label %init_peer_id%] id)
                                     )
                                     (call -relay- ("op" "string_to_b58") [id] k)
                                    )
                                    (call -relay- ("kad" "neighborhood") [k [] []] nodes)
                                   )
                                   (par
                                    (fold nodes n-0
                                     (par
                                      (seq
                                       (xor
                                        (xor
                                         (seq
                                          (seq
                                           (seq
                                            (call n-0 ("peer" "timestamp_sec") [] t-0)
                                            (call n-0 ("trust-graph" "get_weight") [%init_peer_id% t-0] weight)
                                           )
                                           (call n-0 ("registry" "register_key") [label [] t [] "" result_flat.$.[0]! weight t-0] result-0)
                                          )
                                          (xor
                                           (match result-0.$.success! true
                                            (ap true $successful)
                                           )
                                           (ap result-0.$.error! $error)
                                          )
                                         )
                                         (call n-0 ("op" "noop") [])
                                        )
                                        (seq
                                         (call -relay- ("op" "noop") [])
                                         (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 2])
                                        )
                                       )
                                       (call -relay- ("op" "noop") [])
                                      )
                                      (next n-0)
                                     )
                                     (never)
                                    )
                                    (null)
                                   )
                                  )
                                  (new $status
                                   (new $result-1
                                    (seq
                                     (seq
                                      (seq
                                       (par
                                        (seq
                                         (seq
                                          (seq
                                           (call -relay- ("math" "sub") [1 1] sub)
                                           (new $successful_test
                                            (seq
                                             (seq
                                              (seq
                                               (call -relay- ("math" "add") [sub 1] successful_incr)
                                               (fold $successful s
                                                (seq
                                                 (seq
                                                  (ap s $successful_test)
                                                  (canon -relay- $successful_test  #successful_iter_canon)
                                                 )
                                                 (xor
                                                  (match #successful_iter_canon.length successful_incr
                                                   (null)
                                                  )
                                                  (next s)
                                                 )
                                                )
                                                (never)
                                               )
                                              )
                                              (canon -relay- $successful_test  #successful_result_canon)
                                             )
                                             (ap #successful_result_canon successful_gate)
                                            )
                                           )
                                          )
                                          (call -relay- ("math" "sub") [1 1] sub-0)
                                         )
                                         (ap "ok" $status)
                                        )
                                        (call -relay- ("peer" "timeout") [6000 "timeout"] $status)
                                       )
                                       (new $status_test
                                        (seq
                                         (seq
                                          (seq
                                           (call -relay- ("math" "add") [0 1] status_incr)
                                           (fold $status s
                                            (seq
                                             (seq
                                              (ap s $status_test)
                                              (canon -relay- $status_test  #status_iter_canon)
                                             )
                                             (xor
                                              (match #status_iter_canon.length status_incr
                                               (null)
                                              )
                                              (next s)
                                             )
                                            )
                                            (never)
                                           )
                                          )
                                          (canon -relay- $status_test  #status_result_canon)
                                         )
                                         (ap #status_result_canon status_gate)
                                        )
                                       )
                                      )
                                      (xor
                                       (match status_gate.$.[0]! "ok"
                                        (ap true $result-1)
                                       )
                                       (ap false $result-1)
                                      )
                                     )
                                     (new $result-1_test
                                      (seq
                                       (seq
                                        (seq
                                         (call -relay- ("math" "add") [0 1] result-1_incr)
                                         (fold $result-1 s
                                          (seq
                                           (seq
                                            (ap s $result-1_test)
                                            (canon -relay- $result-1_test  #result-1_iter_canon)
                                           )
                                           (xor
                                            (match #result-1_iter_canon.length result-1_incr
                                             (null)
                                            )
                                            (next s)
                                           )
                                          )
                                          (never)
                                         )
                                        )
                                        (canon -relay- $result-1_test  #result-1_result_canon)
                                       )
                                       (ap #result-1_result_canon result-1_gate)
                                      )
                                     )
                                    )
                                   )
                                  )
                                 )
                                 (xor
                                  (match result-1_gate.$.[0]! false
                                   (ap "resource wasn't created: timeout exceeded" $error)
                                  )
                                  (ap id $resource_id)
                                 )
                                )
                               )
                              )
                              (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 3])
                             )
                            )
                            (canon %init_peer_id% $resource_id  #-resource_id-fix-0)
                           )
                           (ap #-resource_id-fix-0 -resource_id-flat-0)
                          )
                         )
                        )
                       )
                       (call %init_peer_id% ("hello-world" "hello") ["Fluence user"] hello)
                      )
                      (xor
                       (seq
                        (canon %init_peer_id% $error  #error_canon)
                        (call %init_peer_id% ("callbackSrv" "response") [-resource_id-flat-0 #error_canon hello])
                       )
                       (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 4])
                      )
                     )
                     (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 5])
                    )
    `;
    return callFunction$$(
        args,
        {
            functionName: 'smokeTest',
            arrow: {
                tag: 'arrow',
                domain: {
                    tag: 'labeledProduct',
                    fields: {
                        label: {
                            tag: 'scalar',
                            name: 'string',
                        },
                    },
                },
                codomain: {
                    tag: 'unlabeledProduct',
                    items: [
                        {
                            tag: 'option',
                            type: {
                                tag: 'scalar',
                                name: 'string',
                            },
                        },
                        {
                            tag: 'array',
                            type: {
                                tag: 'scalar',
                                name: 'string',
                            },
                        },
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

/* eslint-enable */
