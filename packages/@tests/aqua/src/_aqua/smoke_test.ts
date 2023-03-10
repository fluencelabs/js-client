/* eslint-disable */
// @ts-nocheck
/**
 *
 * This file is auto-generated. Do not edit manually: changes may be erased.
 * Generated by Aqua compiler: https://github.com/fluencelabs/aqua/.
 * If you find any bugs, please write an issue on GitHub: https://github.com/fluencelabs/aqua/issues
 * Aqua version: 0.10.2
 *
 */
import type { IFluenceClient as IFluenceClient$$, CallParams as CallParams$$ } from '@fluencelabs/js-client.api';
import {
    v5_callFunction as callFunction$$,
    v5_registerService as registerService$$,
} from '@fluencelabs/js-client.api';
    


// Services

export interface SrvDef {
    create: (wasm_b64_content: string, callParams: CallParams$$<'wasm_b64_content'>) => { error: string | null; service_id: string | null; success: boolean; } | Promise<{ error: string | null; service_id: string | null; success: boolean; }>;
    list: (callParams: CallParams$$<null>) => string[] | Promise<string[]>;
    remove: (service_id: string, callParams: CallParams$$<'service_id'>) => { error: string | null; success: boolean; } | Promise<{ error: string | null; success: boolean; }>;
}
export function registerSrv(service: SrvDef): void;
export function registerSrv(serviceId: string, service: SrvDef): void;
export function registerSrv(peer: IFluenceClient$$, service: SrvDef): void;
export function registerSrv(peer: IFluenceClient$$, serviceId: string, service: SrvDef): void;
       

export function registerSrv(...args: any) {
    registerService$$(
        args,
        {
    "defaultServiceId" : "single_module_srv",
    "functions" : {
        "tag" : "labeledProduct",
        "fields" : {
            "create" : {
                "tag" : "arrow",
                "domain" : {
                    "tag" : "labeledProduct",
                    "fields" : {
                        "wasm_b64_content" : {
                            "tag" : "scalar",
                            "name" : "string"
                        }
                    }
                },
                "codomain" : {
                    "tag" : "unlabeledProduct",
                    "items" : [
                        {
                            "tag" : "struct",
                            "name" : "ServiceCreationResult",
                            "fields" : {
                                "error" : {
                                    "tag" : "option",
                                    "type" : {
                                        "tag" : "scalar",
                                        "name" : "string"
                                    }
                                },
                                "service_id" : {
                                    "tag" : "option",
                                    "type" : {
                                        "tag" : "scalar",
                                        "name" : "string"
                                    }
                                },
                                "success" : {
                                    "tag" : "scalar",
                                    "name" : "bool"
                                }
                            }
                        }
                    ]
                }
            },
            "list" : {
                "tag" : "arrow",
                "domain" : {
                    "tag" : "nil"
                },
                "codomain" : {
                    "tag" : "unlabeledProduct",
                    "items" : [
                        {
                            "tag" : "array",
                            "type" : {
                                "tag" : "scalar",
                                "name" : "string"
                            }
                        }
                    ]
                }
            },
            "remove" : {
                "tag" : "arrow",
                "domain" : {
                    "tag" : "labeledProduct",
                    "fields" : {
                        "service_id" : {
                            "tag" : "scalar",
                            "name" : "string"
                        }
                    }
                },
                "codomain" : {
                    "tag" : "unlabeledProduct",
                    "items" : [
                        {
                            "tag" : "struct",
                            "name" : "RemoveResult",
                            "fields" : {
                                "error" : {
                                    "tag" : "option",
                                    "type" : {
                                        "tag" : "scalar",
                                        "name" : "string"
                                    }
                                },
                                "success" : {
                                    "tag" : "scalar",
                                    "name" : "bool"
                                }
                            }
                        }
                    ]
                }
            }
        }
    }
}
    );
}
      


export interface CalcServiceDef {
    add: (num: number, callParams: CallParams$$<'num'>) => number | Promise<number>;
    clear_state: (callParams: CallParams$$<null>) => void | Promise<void>;
    divide: (num: number, callParams: CallParams$$<'num'>) => number | Promise<number>;
    multiply: (num: number, callParams: CallParams$$<'num'>) => number | Promise<number>;
    state: (callParams: CallParams$$<null>) => number | Promise<number>;
    subtract: (num: number, callParams: CallParams$$<'num'>) => number | Promise<number>;
    test_logs: (callParams: CallParams$$<null>) => void | Promise<void>;
}
export function registerCalcService(serviceId: string, service: CalcServiceDef): void;
export function registerCalcService(peer: IFluenceClient$$, serviceId: string, service: CalcServiceDef): void;
       

export function registerCalcService(...args: any) {
    registerService$$(
        args,
        {
    "functions" : {
        "tag" : "labeledProduct",
        "fields" : {
            "add" : {
                "tag" : "arrow",
                "domain" : {
                    "tag" : "labeledProduct",
                    "fields" : {
                        "num" : {
                            "tag" : "scalar",
                            "name" : "f64"
                        }
                    }
                },
                "codomain" : {
                    "tag" : "unlabeledProduct",
                    "items" : [
                        {
                            "tag" : "scalar",
                            "name" : "f64"
                        }
                    ]
                }
            },
            "clear_state" : {
                "tag" : "arrow",
                "domain" : {
                    "tag" : "nil"
                },
                "codomain" : {
                    "tag" : "nil"
                }
            },
            "divide" : {
                "tag" : "arrow",
                "domain" : {
                    "tag" : "labeledProduct",
                    "fields" : {
                        "num" : {
                            "tag" : "scalar",
                            "name" : "f64"
                        }
                    }
                },
                "codomain" : {
                    "tag" : "unlabeledProduct",
                    "items" : [
                        {
                            "tag" : "scalar",
                            "name" : "f64"
                        }
                    ]
                }
            },
            "multiply" : {
                "tag" : "arrow",
                "domain" : {
                    "tag" : "labeledProduct",
                    "fields" : {
                        "num" : {
                            "tag" : "scalar",
                            "name" : "f64"
                        }
                    }
                },
                "codomain" : {
                    "tag" : "unlabeledProduct",
                    "items" : [
                        {
                            "tag" : "scalar",
                            "name" : "f64"
                        }
                    ]
                }
            },
            "state" : {
                "tag" : "arrow",
                "domain" : {
                    "tag" : "nil"
                },
                "codomain" : {
                    "tag" : "unlabeledProduct",
                    "items" : [
                        {
                            "tag" : "scalar",
                            "name" : "f64"
                        }
                    ]
                }
            },
            "subtract" : {
                "tag" : "arrow",
                "domain" : {
                    "tag" : "labeledProduct",
                    "fields" : {
                        "num" : {
                            "tag" : "scalar",
                            "name" : "f64"
                        }
                    }
                },
                "codomain" : {
                    "tag" : "unlabeledProduct",
                    "items" : [
                        {
                            "tag" : "scalar",
                            "name" : "f64"
                        }
                    ]
                }
            },
            "test_logs" : {
                "tag" : "arrow",
                "domain" : {
                    "tag" : "nil"
                },
                "codomain" : {
                    "tag" : "nil"
                }
            }
        }
    }
}
    );
}
      


export interface HelloWorldDef {
    hello: (str: string, callParams: CallParams$$<'str'>) => string | Promise<string>;
}
export function registerHelloWorld(service: HelloWorldDef): void;
export function registerHelloWorld(serviceId: string, service: HelloWorldDef): void;
export function registerHelloWorld(peer: IFluenceClient$$, service: HelloWorldDef): void;
export function registerHelloWorld(peer: IFluenceClient$$, serviceId: string, service: HelloWorldDef): void;
       

export function registerHelloWorld(...args: any) {
    registerService$$(
        args,
        {
    "defaultServiceId" : "hello-world",
    "functions" : {
        "tag" : "labeledProduct",
        "fields" : {
            "hello" : {
                "tag" : "arrow",
                "domain" : {
                    "tag" : "labeledProduct",
                    "fields" : {
                        "str" : {
                            "tag" : "scalar",
                            "name" : "string"
                        }
                    }
                },
                "codomain" : {
                    "tag" : "unlabeledProduct",
                    "items" : [
                        {
                            "tag" : "scalar",
                            "name" : "string"
                        }
                    ]
                }
            }
        }
    }
}
    );
}
      
// Functions
 
export type ResourceTestResult = [string | null, string[]]
export function resourceTest(
    label: string,
    config?: {ttl?: number}
): Promise<ResourceTestResult>;

export function resourceTest(
    peer: IFluenceClient$$,
    label: string,
    config?: {ttl?: number}
): Promise<ResourceTestResult>;

export function resourceTest(...args: any) {

    let script = `
                    (xor
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
                                              (fold $successful successful_fold_var
                                               (seq
                                                (seq
                                                 (ap successful_fold_var $successful_test)
                                                 (canon -relay- $successful_test  #successful_iter_canon)
                                                )
                                                (xor
                                                 (match #successful_iter_canon.length successful_incr
                                                  (null)
                                                 )
                                                 (next successful_fold_var)
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
                                          (fold $status status_fold_var
                                           (seq
                                            (seq
                                             (ap status_fold_var $status_test)
                                             (canon -relay- $status_test  #status_iter_canon)
                                            )
                                            (xor
                                             (match #status_iter_canon.length status_incr
                                              (null)
                                             )
                                             (next status_fold_var)
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
                                        (fold $result-1 result-1_fold_var
                                         (seq
                                          (seq
                                           (ap result-1_fold_var $result-1_test)
                                           (canon -relay- $result-1_test  #result-1_iter_canon)
                                          )
                                          (xor
                                           (match #result-1_iter_canon.length result-1_incr
                                            (null)
                                           )
                                           (next result-1_fold_var)
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
                      (xor
                       (seq
                        (canon %init_peer_id% $error  #error_canon)
                        (call %init_peer_id% ("callbackSrv" "response") [-resource_id-flat-0 #error_canon])
                       )
                       (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 4])
                      )
                     )
                     (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 5])
                    )
    `
    return callFunction$$(
        args,
        {
    "functionName" : "resourceTest",
    "arrow" : {
        "tag" : "arrow",
        "domain" : {
            "tag" : "labeledProduct",
            "fields" : {
                "label" : {
                    "tag" : "scalar",
                    "name" : "string"
                }
            }
        },
        "codomain" : {
            "tag" : "unlabeledProduct",
            "items" : [
                {
                    "tag" : "option",
                    "type" : {
                        "tag" : "scalar",
                        "name" : "string"
                    }
                },
                {
                    "tag" : "array",
                    "type" : {
                        "tag" : "scalar",
                        "name" : "string"
                    }
                }
            ]
        }
    },
    "names" : {
        "relay" : "-relay-",
        "getDataSrv" : "getDataSrv",
        "callbackSrv" : "callbackSrv",
        "responseSrv" : "callbackSrv",
        "responseFnName" : "response",
        "errorHandlingSrv" : "errorHandlingSrv",
        "errorFnName" : "error"
    }
},
        script
    )
}

 

export function helloTest(
    config?: {ttl?: number}
): Promise<string>;

export function helloTest(
    peer: IFluenceClient$$,
    config?: {ttl?: number}
): Promise<string>;

export function helloTest(...args: any) {

    let script = `
                    (xor
                     (seq
                      (seq
                       (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
                       (call %init_peer_id% ("hello-world" "hello") ["Fluence user"] hello)
                      )
                      (xor
                       (call %init_peer_id% ("callbackSrv" "response") [hello])
                       (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 1])
                      )
                     )
                     (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 2])
                    )
    `
    return callFunction$$(
        args,
        {
    "functionName" : "helloTest",
    "arrow" : {
        "tag" : "arrow",
        "domain" : {
            "tag" : "labeledProduct",
            "fields" : {
                
            }
        },
        "codomain" : {
            "tag" : "unlabeledProduct",
            "items" : [
                {
                    "tag" : "scalar",
                    "name" : "string"
                }
            ]
        }
    },
    "names" : {
        "relay" : "-relay-",
        "getDataSrv" : "getDataSrv",
        "callbackSrv" : "callbackSrv",
        "responseSrv" : "callbackSrv",
        "responseFnName" : "response",
        "errorHandlingSrv" : "errorHandlingSrv",
        "errorFnName" : "error"
    }
},
        script
    )
}

 

export function demo_calculation(
    service_id: string,
    config?: {ttl?: number}
): Promise<number>;

export function demo_calculation(
    peer: IFluenceClient$$,
    service_id: string,
    config?: {ttl?: number}
): Promise<number>;

export function demo_calculation(...args: any) {

    let script = `
                    (xor
                     (seq
                      (seq
                       (seq
                        (seq
                         (seq
                          (seq
                           (seq
                            (seq
                             (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
                             (call %init_peer_id% ("getDataSrv" "service_id") [] service_id)
                            )
                            (call %init_peer_id% (service_id "test_logs") [])
                           )
                           (call %init_peer_id% (service_id "add") [10])
                          )
                          (call %init_peer_id% (service_id "multiply") [5])
                         )
                         (call %init_peer_id% (service_id "subtract") [8])
                        )
                        (call %init_peer_id% (service_id "divide") [6])
                       )
                       (call %init_peer_id% (service_id "state") [] res)
                      )
                      (xor
                       (call %init_peer_id% ("callbackSrv" "response") [res])
                       (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 1])
                      )
                     )
                     (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 2])
                    )
    `
    return callFunction$$(
        args,
        {
    "functionName" : "demo_calculation",
    "arrow" : {
        "tag" : "arrow",
        "domain" : {
            "tag" : "labeledProduct",
            "fields" : {
                "service_id" : {
                    "tag" : "scalar",
                    "name" : "string"
                }
            }
        },
        "codomain" : {
            "tag" : "unlabeledProduct",
            "items" : [
                {
                    "tag" : "scalar",
                    "name" : "f64"
                }
            ]
        }
    },
    "names" : {
        "relay" : "-relay-",
        "getDataSrv" : "getDataSrv",
        "callbackSrv" : "callbackSrv",
        "responseSrv" : "callbackSrv",
        "responseFnName" : "response",
        "errorHandlingSrv" : "errorHandlingSrv",
        "errorFnName" : "error"
    }
},
        script
    )
}

 

export function marineTest(
    wasm64: string,
    config?: {ttl?: number}
): Promise<number>;

export function marineTest(
    peer: IFluenceClient$$,
    wasm64: string,
    config?: {ttl?: number}
): Promise<number>;

export function marineTest(...args: any) {

    let script = `
                    (xor
                     (seq
                      (seq
                       (seq
                        (seq
                         (seq
                          (seq
                           (seq
                            (seq
                             (seq
                              (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
                              (call %init_peer_id% ("getDataSrv" "wasm64") [] wasm64)
                             )
                             (call %init_peer_id% ("single_module_srv" "create") [wasm64] serviceResult)
                            )
                            (call %init_peer_id% (serviceResult.$.service_id.[0]! "test_logs") [])
                           )
                           (call %init_peer_id% (serviceResult.$.service_id.[0]! "add") [10])
                          )
                          (call %init_peer_id% (serviceResult.$.service_id.[0]! "multiply") [5])
                         )
                         (call %init_peer_id% (serviceResult.$.service_id.[0]! "subtract") [8])
                        )
                        (call %init_peer_id% (serviceResult.$.service_id.[0]! "divide") [6])
                       )
                       (call %init_peer_id% (serviceResult.$.service_id.[0]! "state") [] res)
                      )
                      (xor
                       (call %init_peer_id% ("callbackSrv" "response") [res])
                       (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 1])
                      )
                     )
                     (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 2])
                    )
    `
    return callFunction$$(
        args,
        {
    "functionName" : "marineTest",
    "arrow" : {
        "tag" : "arrow",
        "domain" : {
            "tag" : "labeledProduct",
            "fields" : {
                "wasm64" : {
                    "tag" : "scalar",
                    "name" : "string"
                }
            }
        },
        "codomain" : {
            "tag" : "unlabeledProduct",
            "items" : [
                {
                    "tag" : "scalar",
                    "name" : "f64"
                }
            ]
        }
    },
    "names" : {
        "relay" : "-relay-",
        "getDataSrv" : "getDataSrv",
        "callbackSrv" : "callbackSrv",
        "responseSrv" : "callbackSrv",
        "responseFnName" : "response",
        "errorHandlingSrv" : "errorHandlingSrv",
        "errorFnName" : "error"
    }
},
        script
    )
}

/* eslint-enable */