/* eslint-disable */
// @ts-nocheck
/**
 *
 * This file is generated using:
 * @fluencelabs/aqua-api version: 0.0.0
 * @fluencelabs/aqua-to-js version: 0.0.0
 * If you find any bugs in generated AIR, please write an issue on GitHub: https://github.com/fluencelabs/aqua/issues
 * If you find any bugs in generated JS/TS, please write an issue on GitHub: https://github.com/fluencelabs/js-client/issues
 *
 */


import {
    v5_callFunction as callFunction$$,
    v5_registerService as registerService$$,
    FluencePeer as FluencePeer$$
} from '@fluencelabs/js-client';

/**
 * @typedef {import("@fluencelabs/js-client").NonArrowSimpleType} NonArrowSimpleType
 * @typedef {import("@fluencelabs/js-client").JSONValue} JSONValue
 */

/**
 * Convert value from its representation in aqua language to representation in typescript
 * @param {JSONValue} value - value as represented in aqua
 * @param {NonArrowSimpleType} schema - definition of the aqua schema
 * @returns {JSONValue} value represented in typescript
 */
export function aqua2ts(value, schema) {
  if (schema.tag === "nil") {
    return null;
  } else if (schema.tag === "option") {
    if (!Array.isArray(value)) {
      throw new Error("Bad schema");
    }

    if (value.length === 0) {
      return null;
    } else {
      return aqua2ts(value[0], schema.type);
    }
  } else if (
    schema.tag === "scalar" ||
    schema.tag === "bottomType" ||
    schema.tag === "topType"
  ) {
    return value;
  } else if (schema.tag === "array") {
    if (!Array.isArray(value)) {
      throw new Error("Bad schema");
    }

    return value.map((y) => {
      return aqua2ts(y, schema.type);
    });
  } else if (schema.tag === "unlabeledProduct") {
    if (!Array.isArray(value)) {
      throw new Error("Bad schema");
    }

    return value.map((y, i) => {
      return aqua2ts(y, schema.items[i]);
    });
  } else if (schema.tag === "struct" || schema.tag === "labeledProduct") {
    if (typeof value !== "object" || value == null || Array.isArray(value)) {
      throw new Error("Bad schema");
    }

    return Object.entries(schema.fields).reduce((agg, [key, type]) => {
      const val = aqua2ts(value[key], type);
      return { ...agg, [key]: val };
    }, {});
  } else {
    throw new Error("Unexpected tag: " + JSON.stringify(schema));
  }
}

/**
 * Convert value from its typescript representation to representation in aqua
 * @param value {JSONValue} the value as represented in typescript
 * @param schema {NonArrowSimpleType} - definition of the aqua type
 * @returns {JSONValue} represented in aqua
 */
export function ts2aqua(value, schema) {
  if (schema.tag === "nil") {
    return null;
  } else if (schema.tag === "option") {
    if (!Array.isArray(value)) {
      throw new Error("Bad schema");
    }

    return value === null ? [] : [ts2aqua(value, schema.type)];
  } else if (
    schema.tag === "scalar" ||
    schema.tag === "bottomType" ||
    schema.tag === "topType"
  ) {
    return value;
  } else if (schema.tag === "array") {
    if (!Array.isArray(value)) {
      throw new Error("Bad schema");
    }

    return value.map((y) => {
      return ts2aqua(y, schema.type);
    });
  } else if (schema.tag === "unlabeledProduct") {
    if (!Array.isArray(value)) {
      throw new Error("Bad schema");
    }

    return value.map((y, i) => {
      return ts2aqua(y, schema.items[i]);
    });
  } else if (schema.tag === "struct" || schema.tag === "labeledProduct") {
    if (typeof value !== "object" || value == null || Array.isArray(value)) {
      throw new Error("Bad schema");
    }

    return Object.entries(schema.fields).reduce((agg, [key, type]) => {
      const val = ts2aqua(value[key], type);
      return { ...agg, [key]: val };
    }, {});
  } else {
    throw new Error("Unexpected tag: " + JSON.stringify(schema));
  }
}


// Services

export function registerSrv(...args) {
    const service = args.pop();
    const defaultServiceId = "single_module_srv";
            
    const params = args[0] instanceof FluencePeer$$ ? ({
        peer: args[0],
        serviceId: args[1] ?? defaultServiceId
    }) : ({
        peer: undefined,
        serviceId: args[0] ?? defaultServiceId
    });
    
    if (params.serviceId == null) {
        throw new Error("Service ID is not provided");
    }
        
    registerService$$({
        service,
        ...params
    });
}


export function registerCalcService(...args) {
    const service = args.pop();
    const defaultServiceId = undefined;
            
    const params = args[0] instanceof FluencePeer$$ ? ({
        peer: args[0],
        serviceId: args[1] ?? defaultServiceId
    }) : ({
        peer: undefined,
        serviceId: args[0] ?? defaultServiceId
    });
    
    if (params.serviceId == null) {
        throw new Error("Service ID is not provided");
    }
        
    registerService$$({
        service,
        ...params
    });
}


export function registerHelloWorld(...args) {
    const service = args.pop();
    const defaultServiceId = "hello-world";
            
    const params = args[0] instanceof FluencePeer$$ ? ({
        peer: args[0],
        serviceId: args[1] ?? defaultServiceId
    }) : ({
        peer: undefined,
        serviceId: args[0] ?? defaultServiceId
    });
    
    if (params.serviceId == null) {
        throw new Error("Service ID is not provided");
    }
        
    registerService$$({
        service,
        ...params
    });
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


export async function resourceTest(...args) {
    const argNames = ["label"];
    const argCount = argNames.length;
    let peer = undefined;
    if (args[0] instanceof FluencePeer$$) {
        peer = args[0];
        args = args.slice(1);
    }
    
    
    const callArgs = Object.fromEntries(args.slice(0, argCount).map((arg, i) => [argNames[i], arg]));
    
    const params = ({
        peer,
        args: callArgs,
        config: args[argCount]
    });
    
    const result = await callFunction$$({
        script: resourceTest_script,
        ...params,
    });
    
    return aqua2ts(result, 
    {
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
}
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


export async function helloTest(...args) {
    const argNames = [];
    const argCount = argNames.length;
    let peer = undefined;
    if (args[0] instanceof FluencePeer$$) {
        peer = args[0];
        args = args.slice(1);
    }
    
    
    const callArgs = Object.fromEntries(args.slice(0, argCount).map((arg, i) => [argNames[i], arg]));
    
    const params = ({
        peer,
        args: callArgs,
        config: args[argCount]
    });
    
    const result = await callFunction$$({
        script: helloTest_script,
        ...params,
    });
    
    return aqua2ts(result, 
    {
    "name": "string",
    "tag": "scalar"
}
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


export async function demo_calculation(...args) {
    const argNames = ["service_id"];
    const argCount = argNames.length;
    let peer = undefined;
    if (args[0] instanceof FluencePeer$$) {
        peer = args[0];
        args = args.slice(1);
    }
    
    
    const callArgs = Object.fromEntries(args.slice(0, argCount).map((arg, i) => [argNames[i], arg]));
    
    const params = ({
        peer,
        args: callArgs,
        config: args[argCount]
    });
    
    const result = await callFunction$$({
        script: demo_calculation_script,
        ...params,
    });
    
    return aqua2ts(result, 
    {
    "name": "f64",
    "tag": "scalar"
}
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


export async function marineTest(...args) {
    const argNames = ["wasm64"];
    const argCount = argNames.length;
    let peer = undefined;
    if (args[0] instanceof FluencePeer$$) {
        peer = args[0];
        args = args.slice(1);
    }
    
    
    const callArgs = Object.fromEntries(args.slice(0, argCount).map((arg, i) => [argNames[i], arg]));
    
    const params = ({
        peer,
        args: callArgs,
        config: args[argCount]
    });
    
    const result = await callFunction$$({
        script: marineTest_script,
        ...params,
    });
    
    return aqua2ts(result, 
    {
    "name": "f64",
    "tag": "scalar"
}
    ); 
}
