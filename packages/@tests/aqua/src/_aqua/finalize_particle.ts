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
    }
    else if (schema.tag === "option") {
        if (!Array.isArray(value)) {
            throw new Error("Bad schema");
        }
        if (value.length === 0) {
            return null;
        }
        else {
            return aqua2ts(value[0], schema.type);
        }
    }
    else if (schema.tag === "scalar" ||
        schema.tag === "bottomType" ||
        schema.tag === "topType") {
        return value;
    }
    else if (schema.tag === "array") {
        if (!Array.isArray(value)) {
            throw new Error("Bad schema");
        }
        return value.map((y) => {
            return aqua2ts(y, schema.type);
        });
    }
    else if (schema.tag === "unlabeledProduct") {
        if (!Array.isArray(value)) {
            throw new Error("Bad schema");
        }
        return value.map((y, i) => {
            return aqua2ts(y, schema.items[i]);
        });
    }
    else if (schema.tag === "struct" || schema.tag === "labeledProduct") {
        if (typeof value !== "object" || value == null || Array.isArray(value)) {
            throw new Error("Bad schema");
        }
        return Object.entries(schema.fields).reduce((agg, [key, type]) => {
            const val = aqua2ts(value[key], type);
            return { ...agg, [key]: val };
        }, {});
    }
    else {
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
    }
    else if (schema.tag === "option") {
        return value == null ? [] : [ts2aqua(value, schema.type)];
    }
    else if (schema.tag === "scalar" ||
        schema.tag === "bottomType" ||
        schema.tag === "topType") {
        return value;
    }
    else if (schema.tag === "array") {
        if (!Array.isArray(value)) {
            throw new Error("Bad schema");
        }
        return value.map((y) => {
            return ts2aqua(y, schema.type);
        });
    }
    else if (schema.tag === "unlabeledProduct") {
        if (!Array.isArray(value)) {
            throw new Error("Bad schema");
        }
        return value.map((y, i) => {
            return ts2aqua(y, schema.items[i]);
        });
    }
    else if (schema.tag === "struct" || schema.tag === "labeledProduct") {
        if (typeof value !== "object" || value == null || Array.isArray(value)) {
            throw new Error("Bad schema");
        }
        return Object.entries(schema.fields).reduce((agg, [key, type]) => {
            const val = ts2aqua(value[key], type);
            return { ...agg, [key]: val };
        }, {});
    }
    else {
        throw new Error("Unexpected tag: " + JSON.stringify(schema));
    }
}



// Functions
export const test_script = `
(seq
 (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
 (xor
  (xor
   (call -relay- ("op" "noop") [])
   (fail %last_error%)
  )
  (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 0])
 )
)
`;

export function test(
    config?: {ttl?: number}
): Promise<void>;

export function test(
    peer: IFluenceClient$$,
    config?: {ttl?: number}
): Promise<void>;

export function test(...args: any[]) {
    return callFunction$$(
        args,
        {
    "functionName": "test",
    "arrow": {
        "domain": {
            "fields": {},
            "tag": "labeledProduct"
        },
        "codomain": {
            "tag": "nil"
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
        test_script
    );
}
