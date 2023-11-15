/* eslint-disable */
// @ts-nocheck
/**
 *
 * This file is generated using:
 * @fluencelabs/aqua-api version: 0.12.0
 * @fluencelabs/aqua-to-js version: 0.2.0
 * If you find any bugs in generated AIR, please write an issue on GitHub: https://github.com/fluencelabs/aqua/issues
 * If you find any bugs in generated JS/TS, please write an issue on GitHub: https://github.com/fluencelabs/js-client/issues
 *
 */
import type { IFluenceClient as IFluenceClient$$, ParticleContext as ParticleContext$$ } from '@fluencelabs/js-client';

import {
    v5_callFunction as callFunction$$,
    v5_registerService as registerService$$,
    FluencePeer as FluencePeer$$
} from '@fluencelabs/js-client';

// Services
export interface SrvDef {
    create: (wasm_b64_content: string, callParams: ParticleContext$$) => { error: string | null; service_id: string | null; success: boolean; } | Promise<{ error: string | null; service_id: string | null; success: boolean; }>;
    list: (callParams: ParticleContext$$) => string[] | Promise<string[]>;
    remove: (service_id: string, callParams: ParticleContext$$) => { error: string | null; success: boolean; } | Promise<{ error: string | null; success: boolean; }>;
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
    divide: (num: number, callParams: ParticleContext$$) => number | Promise<number>;
    clear_state: (callParams: ParticleContext$$) => void | Promise<void>;
    test_logs: (callParams: ParticleContext$$) => void | Promise<void>;
    multiply: (num: number, callParams: ParticleContext$$) => number | Promise<number>;
    add: (num: number, callParams: ParticleContext$$) => number | Promise<number>;
    state: (callParams: ParticleContext$$) => number | Promise<number>;
    subtract: (num: number, callParams: ParticleContext$$) => number | Promise<number>;
}
export function registerCalcService(serviceId: string, service: CalcServiceDef): void;
export function registerCalcService(peer: IFluenceClient$$, serviceId: string, service: CalcServiceDef): void;
export function registerCalcService(...args: any[]) {
    registerService$$(
        args,
        {
    "functions": {
        "fields": {
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
            "clear_state": {
                "domain": {
                    "tag": "nil"
                },
                "codomain": {
                    "tag": "nil"
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
            }
        },
        "tag": "labeledProduct"
    }
}
    );
}

export interface HelloWorldDef {
    hello: (str: string, callParams: ParticleContext$$) => string | Promise<string>;
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
    (call %init_peer_id% ("getDataSrv" "label") [] -label-arg-)
   )
   (xor
    (new $resource_id
     (seq
      (seq
       (seq
        (call %init_peer_id% ("peer" "timestamp_sec") [] ret)
        (xor
         (seq
          (seq
           (call -relay- ("registry" "get_key_bytes") [-label-arg- [] ret [] ""] ret-0)
           (xor
            (call %init_peer_id% ("sig" "sign") [ret-0] ret-1)
            (fail %last_error%)
           )
          )
          (xor
           (match ret-1.$.success false
            (ap ret-1.$.error.[0] $error)
           )
           (new $successful
            (seq
             (seq
              (seq
               (seq
                (seq
                 (seq
                  (ap ret-1.$.signature ret-1_flat)
                  (call -relay- ("registry" "get_key_id") [-label-arg- %init_peer_id%] ret-2)
                 )
                 (call -relay- ("op" "string_to_b58") [ret-2] ret-3)
                )
                (call -relay- ("kad" "neighborhood") [ret-3 [] []] ret-4)
               )
               (par
                (fold ret-4 n-0
                 (par
                  (xor
                   (xor
                    (seq
                     (seq
                      (seq
                       (call n-0 ("peer" "timestamp_sec") [] ret-5)
                       (call n-0 ("trust-graph" "get_weight") [%init_peer_id% ret-5] ret-6)
                      )
                      (call n-0 ("registry" "register_key") [-label-arg- [] ret [] "" ret-1_flat.$.[0] ret-6 ret-5] ret-7)
                     )
                     (xor
                      (seq
                       (match ret-7.$.success true
                        (ap true $successful)
                       )
                       (new $-ephemeral-stream-
                        (new #-ephemeral-canon-
                         (canon -relay- $-ephemeral-stream-  #-ephemeral-canon-)
                        )
                       )
                      )
                      (seq
                       (ap ret-7.$.error $error)
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
                    (seq
                     (call -relay- ("peer" "timeout") [6000 "timeout"] ret-8)
                     (ap ret-8 $status)
                    )
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
              (ap ret-2 $resource_id)
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
   (call %init_peer_id% ("hello-world" "hello") ["Fluence user"] ret)
   (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 0])
  )
 )
 (call %init_peer_id% ("callbackSrv" "response") [ret])
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

export const callHappy_script = `
(seq
 (seq
  (seq
   (seq
    (seq
     (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
     (call %init_peer_id% ("getDataSrv" "a") [] -a-arg-)
    )
    (call %init_peer_id% ("getDataSrv" "b") [] -b-arg-)
   )
   (call %init_peer_id% ("getDataSrv" "c") [] -c-arg-)
  )
  (xor
   (xor
    (call %init_peer_id% ("callbackSrv" "d") ["abc"] init_call_res0)
    (fail %last_error%)
   )
   (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 0])
  )
 )
 (call %init_peer_id% ("callbackSrv" "response") [init_call_res0])
)
`;

export function callHappy(
    a: string,
    b: number,
    c: number,
    d: (arg0: string) => number | Promise<number>,
    config?: {ttl?: number}
): Promise<number>;

export function callHappy(
    peer: IFluenceClient$$,
    a: string,
    b: number,
    c: number,
    d: (arg0: string) => number | Promise<number>,
    config?: {ttl?: number}
): Promise<number>;

export function callHappy(...args: any[]) {
    return callFunction$$(
        args,
        {
    "functionName": "callHappy",
    "arrow": {
        "domain": {
            "fields": {
                "a": {
                    "name": "string",
                    "tag": "scalar"
                },
                "b": {
                    "name": "f64",
                    "tag": "scalar"
                },
                "c": {
                    "name": "f64",
                    "tag": "scalar"
                },
                "d": {
                    "domain": {
                        "items": [
                            {
                                "name": "string",
                                "tag": "scalar"
                            }
                        ],
                        "tag": "unlabeledProduct"
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
        callHappy_script
    );
}

export const demo_calculation_script = `
(seq
 (seq
  (seq
   (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
   (call %init_peer_id% ("getDataSrv" "service_id") [] -service_id-arg-)
  )
  (xor
   (seq
    (seq
     (seq
      (seq
       (seq
        (call %init_peer_id% (-service_id-arg- "test_logs") [])
        (call %init_peer_id% (-service_id-arg- "add") [10] ret)
       )
       (call %init_peer_id% (-service_id-arg- "multiply") [5] ret-0)
      )
      (call %init_peer_id% (-service_id-arg- "subtract") [8] ret-1)
     )
     (call %init_peer_id% (-service_id-arg- "divide") [6] ret-2)
    )
    (call %init_peer_id% (-service_id-arg- "state") [] ret-3)
   )
   (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 0])
  )
 )
 (call %init_peer_id% ("callbackSrv" "response") [ret-3])
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
   (call %init_peer_id% ("getDataSrv" "wasm64") [] -wasm64-arg-)
  )
  (xor
   (seq
    (seq
     (seq
      (seq
       (seq
        (seq
         (call %init_peer_id% ("single_module_srv" "create") [-wasm64-arg-] ret)
         (call %init_peer_id% (ret.$.service_id.[0] "test_logs") [])
        )
        (call %init_peer_id% (ret.$.service_id.[0] "add") [10] ret-0)
       )
       (call %init_peer_id% (ret.$.service_id.[0] "multiply") [5] ret-1)
      )
      (call %init_peer_id% (ret.$.service_id.[0] "subtract") [8] ret-2)
     )
     (call %init_peer_id% (ret.$.service_id.[0] "divide") [6] ret-3)
    )
    (call %init_peer_id% (ret.$.service_id.[0] "state") [] ret-4)
   )
   (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 0])
  )
 )
 (call %init_peer_id% ("callbackSrv" "response") [ret-4])
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
