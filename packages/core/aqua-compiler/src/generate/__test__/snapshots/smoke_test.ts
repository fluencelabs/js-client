/* eslint-disable */
// @ts-nocheck
/**
 *
 * This file is generated using:
 * @fluencelabs/aqua-api version: 0.0.0
 * @fluencelabs/aqua-compiler version: 0.0.0
 * If you find any bugs in generated AIR, please write an issue on GitHub: https://github.com/fluencelabs/aqua/issues
 * If you find any bugs in generated JS/TS, please write an issue on GitHub: https://github.com/fluencelabs/js-client/issues
 *
 */
import type { IFluenceClient as IFluenceClient$$, CallParams as CallParams$$ } from '@fluencelabs/js-client';

import {
    v5_callFunction as callFunction$$,
    v5_registerService as registerService$$,
} from '@fluencelabs/js-client';

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
export function registerSrv(...args: any[]) {
    registerService$$(
        args,
        {
    "defaultServiceId": "single_module_srv",
    "functions": {
        "fields": {
            "create": {
                "domain": {
                    "fields": {
                        "wasm_b64_content": {
                            "name": "string",
                            "tag": "scalar"
                        }
                    },
                    "tag": "labeledProduct"
                },
                "codomain": {
                    "items": [
                        {
                            "name": "ServiceCreationResult",
                            "fields": {
                                "error": {
                                    "type": {
                                        "name": "string",
                                        "tag": "scalar"
                                    },
                                    "tag": "option"
                                },
                                "service_id": {
                                    "type": {
                                        "name": "string",
                                        "tag": "scalar"
                                    },
                                    "tag": "option"
                                },
                                "success": {
                                    "name": "bool",
                                    "tag": "scalar"
                                }
                            },
                            "tag": "struct"
                        }
                    ],
                    "tag": "unlabeledProduct"
                },
                "tag": "arrow"
            },
            "list": {
                "domain": {
                    "tag": "nil"
                },
                "codomain": {
                    "items": [
                        {
                            "type": {
                                "name": "string",
                                "tag": "scalar"
                            },
                            "tag": "array"
                        }
                    ],
                    "tag": "unlabeledProduct"
                },
                "tag": "arrow"
            },
            "remove": {
                "domain": {
                    "fields": {
                        "service_id": {
                            "name": "string",
                            "tag": "scalar"
                        }
                    },
                    "tag": "labeledProduct"
                },
                "codomain": {
                    "items": [
                        {
                            "name": "RemoveResult",
                            "fields": {
                                "error": {
                                    "type": {
                                        "name": "string",
                                        "tag": "scalar"
                                    },
                                    "tag": "option"
                                },
                                "success": {
                                    "name": "bool",
                                    "tag": "scalar"
                                }
                            },
                            "tag": "struct"
                        }
                    ],
                    "tag": "unlabeledProduct"
                },
                "tag": "arrow"
            }
        },
        "tag": "labeledProduct"
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
export function registerCalcService(service: CalcServiceDef): void;
export function registerCalcService(serviceId: string, service: CalcServiceDef): void;
export function registerCalcService(peer: IFluenceClient$$, service: CalcServiceDef): void;
export function registerCalcService(peer: IFluenceClient$$, serviceId: string, service: CalcServiceDef): void;
export function registerCalcService(...args: any[]) {
    registerService$$(
        args,
        {
    "functions": {
        "fields": {
            "add": {
                "domain": {
                    "fields": {
                        "num": {
                            "name": "f64",
                            "tag": "scalar"
                        }
                    },
                    "tag": "labeledProduct"
                },
                "codomain": {
                    "items": [
                        {
                            "name": "f64",
                            "tag": "scalar"
                        }
                    ],
                    "tag": "unlabeledProduct"
                },
                "tag": "arrow"
            },
            "clear_state": {
                "domain": {
                    "tag": "nil"
                },
                "codomain": {
                    "tag": "nil"
                },
                "tag": "arrow"
            },
            "divide": {
                "domain": {
                    "fields": {
                        "num": {
                            "name": "f64",
                            "tag": "scalar"
                        }
                    },
                    "tag": "labeledProduct"
                },
                "codomain": {
                    "items": [
                        {
                            "name": "f64",
                            "tag": "scalar"
                        }
                    ],
                    "tag": "unlabeledProduct"
                },
                "tag": "arrow"
            },
            "multiply": {
                "domain": {
                    "fields": {
                        "num": {
                            "name": "f64",
                            "tag": "scalar"
                        }
                    },
                    "tag": "labeledProduct"
                },
                "codomain": {
                    "items": [
                        {
                            "name": "f64",
                            "tag": "scalar"
                        }
                    ],
                    "tag": "unlabeledProduct"
                },
                "tag": "arrow"
            },
            "state": {
                "domain": {
                    "tag": "nil"
                },
                "codomain": {
                    "items": [
                        {
                            "name": "f64",
                            "tag": "scalar"
                        }
                    ],
                    "tag": "unlabeledProduct"
                },
                "tag": "arrow"
            },
            "subtract": {
                "domain": {
                    "fields": {
                        "num": {
                            "name": "f64",
                            "tag": "scalar"
                        }
                    },
                    "tag": "labeledProduct"
                },
                "codomain": {
                    "items": [
                        {
                            "name": "f64",
                            "tag": "scalar"
                        }
                    ],
                    "tag": "unlabeledProduct"
                },
                "tag": "arrow"
            },
            "test_logs": {
                "domain": {
                    "tag": "nil"
                },
                "codomain": {
                    "tag": "nil"
                },
                "tag": "arrow"
            }
        },
        "tag": "labeledProduct"
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
export function registerHelloWorld(...args: any[]) {
    registerService$$(
        args,
        {
    "defaultServiceId": "hello-world",
    "functions": {
        "fields": {
            "hello": {
                "domain": {
                    "fields": {
                        "str": {
                            "name": "string",
                            "tag": "scalar"
                        }
                    },
                    "tag": "labeledProduct"
                },
                "codomain": {
                    "items": [
                        {
                            "name": "string",
                            "tag": "scalar"
                        }
                    ],
                    "tag": "unlabeledProduct"
                },
                "tag": "arrow"
            }
        },
        "tag": "labeledProduct"
    }
}
    );
}


// Functions
export const resourceTest_script = `
(seq
 (seq
  (seq
   (seq
    (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
    (call %init_peer_id% ("getDataSrv" "label") [] label)
   )
   (xor
    (new $resource_id
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
            (fail %last_error%)
           )
          )
          (xor
           (match result.$.success false
            (ap result.$.error.[0] $error)
           )
           (new $successful
            (seq
             (seq
              (seq
               (seq
                (seq
                 (seq
                  (ap result.$.signature result_flat)
                  (call -relay- ("registry" "get_key_id") [label %init_peer_id%] id)
                 )
                 (call -relay- ("op" "string_to_b58") [id] k)
                )
                (call -relay- ("kad" "neighborhood") [k [] []] nodes)
               )
               (par
                (fold nodes n-0
                 (par
                  (xor
                   (xor
                    (seq
                     (seq
                      (seq
                       (call n-0 ("peer" "timestamp_sec") [] t-0)
                       (call n-0 ("trust-graph" "get_weight") [%init_peer_id% t-0] weight)
                      )
                      (call n-0 ("registry" "register_key") [label [] t [] "" result_flat.$.[0] weight t-0] result-0)
                     )
                     (xor
                      (seq
                       (match result-0.$.success true
                        (ap true $successful)
                       )
                       (new $-ephemeral-stream-
                        (new #-ephemeral-canon-
                         (canon -relay- $-ephemeral-stream-  #-ephemeral-canon-)
                        )
                       )
                      )
                      (seq
                       (ap result-0.$.error $error)
                       (new $-ephemeral-stream-
                        (new #-ephemeral-canon-
                         (canon -relay- $-ephemeral-stream-  #-ephemeral-canon-)
                        )
                       )
                      )
                     )
                    )
                    (null)
                   )
                   (fail %last_error%)
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
                   (match status_gate.$.[0] "ok"
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
              (match result-1_gate.$.[0] false
               (ap "resource wasn't created: timeout exceeded" $error)
              )
              (ap id $resource_id)
             )
            )
           )
          )
         )
         (fail %last_error%)
        )
       )
       (canon %init_peer_id% $resource_id  #-resource_id-fix-0)
      )
      (ap #-resource_id-fix-0 -resource_id-flat-0)
     )
    )
    (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 0])
   )
  )
  (canon %init_peer_id% $error  #error_canon)
 )
 (call %init_peer_id% ("callbackSrv" "response") [-resource_id-flat-0 #error_canon])
)
`;

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

export function resourceTest(...args: any[]) {
    return callFunction$$(
        args,
        {
    "functionName": "resourceTest",
    "arrow": {
        "domain": {
            "fields": {
                "label": {
                    "name": "string",
                    "tag": "scalar"
                }
            },
            "tag": "labeledProduct"
        },
        "codomain": {
            "items": [
                {
                    "type": {
                        "name": "string",
                        "tag": "scalar"
                    },
                    "tag": "option"
                },
                {
                    "type": {
                        "name": "string",
                        "tag": "scalar"
                    },
                    "tag": "array"
                }
            ],
            "tag": "unlabeledProduct"
        },
        "tag": "arrow"
    },
    "names": {
        "relay": "-relay-",
        "getDataSrv": "getDataSrv",
        "callbackSrv": "callbackSrv",
        "responseSrv": "callbackSrv",
        "responseFnName": "response",
        "errorHandlingSrv": "errorHandlingSrv",
        "errorFnName": "error"
    }
},
        resourceTest_script
    );
}

export const helloTest_script = `
(seq
 (seq
  (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
  (xor
   (call %init_peer_id% ("hello-world" "hello") ["Fluence user"] hello)
   (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 0])
  )
 )
 (call %init_peer_id% ("callbackSrv" "response") [hello])
)
`;

export function helloTest(
    config?: {ttl?: number}
): Promise<string>;

export function helloTest(
    peer: IFluenceClient$$,
    config?: {ttl?: number}
): Promise<string>;

export function helloTest(...args: any[]) {
    return callFunction$$(
        args,
        {
    "functionName": "helloTest",
    "arrow": {
        "domain": {
            "fields": {},
            "tag": "labeledProduct"
        },
        "codomain": {
            "items": [
                {
                    "name": "string",
                    "tag": "scalar"
                }
            ],
            "tag": "unlabeledProduct"
        },
        "tag": "arrow"
    },
    "names": {
        "relay": "-relay-",
        "getDataSrv": "getDataSrv",
        "callbackSrv": "callbackSrv",
        "responseSrv": "callbackSrv",
        "responseFnName": "response",
        "errorHandlingSrv": "errorHandlingSrv",
        "errorFnName": "error"
    }
},
        helloTest_script
    );
}

export const demo_calculation_script = `
(seq
 (seq
  (seq
   (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
   (call %init_peer_id% ("getDataSrv" "service_id") [] service_id)
  )
  (xor
   (seq
    (seq
     (seq
      (seq
       (seq
        (call %init_peer_id% (service_id "test_logs") [])
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
   (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 0])
  )
 )
 (call %init_peer_id% ("callbackSrv" "response") [res])
)
`;

export function demo_calculation(
    service_id: string,
    config?: {ttl?: number}
): Promise<number>;

export function demo_calculation(
    peer: IFluenceClient$$,
    service_id: string,
    config?: {ttl?: number}
): Promise<number>;

export function demo_calculation(...args: any[]) {
    return callFunction$$(
        args,
        {
    "functionName": "demo_calculation",
    "arrow": {
        "domain": {
            "fields": {
                "service_id": {
                    "name": "string",
                    "tag": "scalar"
                }
            },
            "tag": "labeledProduct"
        },
        "codomain": {
            "items": [
                {
                    "name": "f64",
                    "tag": "scalar"
                }
            ],
            "tag": "unlabeledProduct"
        },
        "tag": "arrow"
    },
    "names": {
        "relay": "-relay-",
        "getDataSrv": "getDataSrv",
        "callbackSrv": "callbackSrv",
        "responseSrv": "callbackSrv",
        "responseFnName": "response",
        "errorHandlingSrv": "errorHandlingSrv",
        "errorFnName": "error"
    }
},
        demo_calculation_script
    );
}

export const marineTest_script = `
(seq
 (seq
  (seq
   (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
   (call %init_peer_id% ("getDataSrv" "wasm64") [] wasm64)
  )
  (xor
   (seq
    (seq
     (seq
      (seq
       (seq
        (seq
         (call %init_peer_id% ("single_module_srv" "create") [wasm64] serviceResult)
         (call %init_peer_id% (serviceResult.$.service_id.[0] "test_logs") [])
        )
        (call %init_peer_id% (serviceResult.$.service_id.[0] "add") [10])
       )
       (call %init_peer_id% (serviceResult.$.service_id.[0] "multiply") [5])
      )
      (call %init_peer_id% (serviceResult.$.service_id.[0] "subtract") [8])
     )
     (call %init_peer_id% (serviceResult.$.service_id.[0] "divide") [6])
    )
    (call %init_peer_id% (serviceResult.$.service_id.[0] "state") [] res)
   )
   (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 0])
  )
 )
 (call %init_peer_id% ("callbackSrv" "response") [res])
)
`;

export function marineTest(
    wasm64: string,
    config?: {ttl?: number}
): Promise<number>;

export function marineTest(
    peer: IFluenceClient$$,
    wasm64: string,
    config?: {ttl?: number}
): Promise<number>;

export function marineTest(...args: any[]) {
    return callFunction$$(
        args,
        {
    "functionName": "marineTest",
    "arrow": {
        "domain": {
            "fields": {
                "wasm64": {
                    "name": "string",
                    "tag": "scalar"
                }
            },
            "tag": "labeledProduct"
        },
        "codomain": {
            "items": [
                {
                    "name": "f64",
                    "tag": "scalar"
                }
            ],
            "tag": "unlabeledProduct"
        },
        "tag": "arrow"
    },
    "names": {
        "relay": "-relay-",
        "getDataSrv": "getDataSrv",
        "callbackSrv": "callbackSrv",
        "responseSrv": "callbackSrv",
        "responseFnName": "response",
        "errorHandlingSrv": "errorHandlingSrv",
        "errorFnName": "error"
    }
},
        marineTest_script
    );
}
