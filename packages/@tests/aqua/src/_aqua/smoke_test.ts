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
import type {
  IFluenceClient as IFluenceClient$$,
  ParticleContext as ParticleContext$$,
} from "@fluencelabs/js-client";

import {
  v5_callFunction as callFunction$$,
  v5_registerService as registerService$$,
  FluencePeer as FluencePeer$$,
} from "@fluencelabs/js-client";

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
export interface SrvDef {
  create: (
    wasm_b64_content: string,
    callParams: ParticleContext$$,
  ) =>
    | { error: string | null; service_id: string | null; success: boolean }
    | Promise<{
        error: string | null;
        service_id: string | null;
        success: boolean;
      }>;
  list: (callParams: ParticleContext$$) => string[] | Promise<string[]>;
  remove: (
    service_id: string,
    callParams: ParticleContext$$,
  ) =>
    | { error: string | null; success: boolean }
    | Promise<{ error: string | null; success: boolean }>;
}
export function registerSrv(service: SrvDef): void;
export function registerSrv(serviceId: string, service: SrvDef): void;
export function registerSrv(peer: IFluenceClient$$, service: SrvDef): void;
export function registerSrv(
  peer: IFluenceClient$$,
  serviceId: string,
  service: SrvDef,
): void;
export function registerSrv(...args: any[]) {
  const service = args.pop();
  const defaultServiceId = "single_module_srv";

  const params =
    args[0] instanceof FluencePeer$$
      ? {
          peer: args[0],
          serviceId: args[1] ?? defaultServiceId,
        }
      : {
          peer: undefined,
          serviceId: args[0] ?? defaultServiceId,
        };

  if (params.serviceId == null) {
    throw new Error("Service ID is not provided");
  }

  registerService$$({
    service,
    ...params,
  });
}

export interface CalcServiceDef {
  divide: (
    num: number,
    callParams: ParticleContext$$,
  ) => number | Promise<number>;
  clear_state: (callParams: ParticleContext$$) => void | Promise<void>;
  test_logs: (callParams: ParticleContext$$) => void | Promise<void>;
  multiply: (
    num: number,
    callParams: ParticleContext$$,
  ) => number | Promise<number>;
  add: (num: number, callParams: ParticleContext$$) => number | Promise<number>;
  state: (callParams: ParticleContext$$) => number | Promise<number>;
  subtract: (
    num: number,
    callParams: ParticleContext$$,
  ) => number | Promise<number>;
}
export function registerCalcService(
  serviceId: string,
  service: CalcServiceDef,
): void;
export function registerCalcService(
  peer: IFluenceClient$$,
  serviceId: string,
  service: CalcServiceDef,
): void;
export function registerCalcService(...args: any[]) {
  const service = args.pop();
  const defaultServiceId = undefined;

  const params =
    args[0] instanceof FluencePeer$$
      ? {
          peer: args[0],
          serviceId: args[1] ?? defaultServiceId,
        }
      : {
          peer: undefined,
          serviceId: args[0] ?? defaultServiceId,
        };

  if (params.serviceId == null) {
    throw new Error("Service ID is not provided");
  }

  registerService$$({
    service,
    ...params,
  });
}

export interface HelloWorldDef {
  hello: (
    str: string,
    callParams: ParticleContext$$,
  ) => string | Promise<string>;
}
export function registerHelloWorld(service: HelloWorldDef): void;
export function registerHelloWorld(
  serviceId: string,
  service: HelloWorldDef,
): void;
export function registerHelloWorld(
  peer: IFluenceClient$$,
  service: HelloWorldDef,
): void;
export function registerHelloWorld(
  peer: IFluenceClient$$,
  serviceId: string,
  service: HelloWorldDef,
): void;
export function registerHelloWorld(...args: any[]) {
  const service = args.pop();
  const defaultServiceId = "hello-world";

  const params =
    args[0] instanceof FluencePeer$$
      ? {
          peer: args[0],
          serviceId: args[1] ?? defaultServiceId,
        }
      : {
          peer: undefined,
          serviceId: args[0] ?? defaultServiceId,
        };

  if (params.serviceId == null) {
    throw new Error("Service ID is not provided");
  }

  registerService$$({
    service,
    ...params,
  });
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

export type ResourceTestResult = [string | null, string[]];

export function resourceTest(
  label: string,
  config?: { ttl?: number },
): Promise<ResourceTestResult>;

export function resourceTest(
  peer: IFluenceClient$$,
  label: string,
  config?: { ttl?: number },
): Promise<ResourceTestResult>;

export async function resourceTest(...args: any[]) {
  const argNames = ["label"];
  const argCount = argNames.length;
  let peer = undefined;
  if (args[0] instanceof FluencePeer$$) {
    peer = args[0];
    args = args.slice(1);
  }

  const callArgs = Object.fromEntries(
    args.slice(0, argCount).map((arg, i) => [argNames[i], arg]),
  );

  const params = {
    peer,
    args: callArgs,
    config: args[argCount],
  };

  const result = await callFunction$$({
    script: resourceTest_script,
    ...params,
  });

  return aqua2ts(result, {
    items: [
      {
        type: {
          name: "string",
          tag: "scalar",
        },
        tag: "option",
      },
      {
        type: {
          name: "string",
          tag: "scalar",
        },
        tag: "array",
      },
    ],
    tag: "unlabeledProduct",
  });
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

export function helloTest(config?: { ttl?: number }): Promise<string>;

export function helloTest(
  peer: IFluenceClient$$,
  config?: { ttl?: number },
): Promise<string>;

export async function helloTest(...args: any[]) {
  const argNames = [];
  const argCount = argNames.length;
  let peer = undefined;
  if (args[0] instanceof FluencePeer$$) {
    peer = args[0];
    args = args.slice(1);
  }

  const callArgs = Object.fromEntries(
    args.slice(0, argCount).map((arg, i) => [argNames[i], arg]),
  );

  const params = {
    peer,
    args: callArgs,
    config: args[argCount],
  };

  const result = await callFunction$$({
    script: helloTest_script,
    ...params,
  });

  return aqua2ts(result, {
    name: "string",
    tag: "scalar",
  });
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
  config?: { ttl?: number },
): Promise<number>;

export function callHappy(
  peer: IFluenceClient$$,
  a: string,
  b: number,
  c: number,
  d: (arg0: string) => number | Promise<number>,
  config?: { ttl?: number },
): Promise<number>;

export async function callHappy(...args: any[]) {
  const argNames = ["a", "b", "c", "d"];
  const argCount = argNames.length;
  let peer = undefined;
  if (args[0] instanceof FluencePeer$$) {
    peer = args[0];
    args = args.slice(1);
  }

  const callArgs = Object.fromEntries(
    args.slice(0, argCount).map((arg, i) => [argNames[i], arg]),
  );

  const params = {
    peer,
    args: callArgs,
    config: args[argCount],
  };

  const result = await callFunction$$({
    script: callHappy_script,
    ...params,
  });

  return aqua2ts(result, {
    name: "f64",
    tag: "scalar",
  });
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
  config?: { ttl?: number },
): Promise<number>;

export function demo_calculation(
  peer: IFluenceClient$$,
  service_id: string,
  config?: { ttl?: number },
): Promise<number>;

export async function demo_calculation(...args: any[]) {
  const argNames = ["service_id"];
  const argCount = argNames.length;
  let peer = undefined;
  if (args[0] instanceof FluencePeer$$) {
    peer = args[0];
    args = args.slice(1);
  }

  const callArgs = Object.fromEntries(
    args.slice(0, argCount).map((arg, i) => [argNames[i], arg]),
  );

  const params = {
    peer,
    args: callArgs,
    config: args[argCount],
  };

  const result = await callFunction$$({
    script: demo_calculation_script,
    ...params,
  });

  return aqua2ts(result, {
    name: "f64",
    tag: "scalar",
  });
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
  config?: { ttl?: number },
): Promise<number>;

export function marineTest(
  peer: IFluenceClient$$,
  wasm64: string,
  config?: { ttl?: number },
): Promise<number>;

export async function marineTest(...args: any[]) {
  const argNames = ["wasm64"];
  const argCount = argNames.length;
  let peer = undefined;
  if (args[0] instanceof FluencePeer$$) {
    peer = args[0];
    args = args.slice(1);
  }

  const callArgs = Object.fromEntries(
    args.slice(0, argCount).map((arg, i) => [argNames[i], arg]),
  );

  const params = {
    peer,
    args: callArgs,
    config: args[argCount],
  };

  const result = await callFunction$$({
    script: marineTest_script,
    ...params,
  });

  return aqua2ts(result, {
    name: "f64",
    tag: "scalar",
  });
}
