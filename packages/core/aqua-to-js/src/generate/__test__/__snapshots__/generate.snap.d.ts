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
    create: (wasm_b64_content: string, callParams: ParticleContext$$) => { error: string | null; service_id: string | null; success: boolean; } | Promise<{ error: string | null; service_id: string | null; success: boolean; }>;
    list: (callParams: ParticleContext$$) => string[] | Promise<string[]>;
    remove: (service_id: string, callParams: ParticleContext$$) => { error: string | null; success: boolean; } | Promise<{ error: string | null; success: boolean; }>;
}
export function registerSrv(service: SrvDef): void;
export function registerSrv(serviceId: string, service: SrvDef): void;
export function registerSrv(peer: IFluenceClient$$, service: SrvDef): void;
export function registerSrv(peer: IFluenceClient$$, serviceId: string, service: SrvDef): void;
export interface CalcServiceDef {
    add: (num: number, callParams: ParticleContext$$) => number | Promise<number>;
    clear_state: (callParams: ParticleContext$$) => void | Promise<void>;
    divide: (num: number, callParams: ParticleContext$$) => number | Promise<number>;
    multiply: (num: number, callParams: ParticleContext$$) => number | Promise<number>;
    state: (callParams: ParticleContext$$) => number | Promise<number>;
    subtract: (num: number, callParams: ParticleContext$$) => number | Promise<number>;
    test_logs: (callParams: ParticleContext$$) => void | Promise<void>;
}
export function registerCalcService(serviceId: string, service: CalcServiceDef): void;
export function registerCalcService(peer: IFluenceClient$$, serviceId: string, service: CalcServiceDef): void;
export interface HelloWorldDef {
    hello: (str: string, callParams: ParticleContext$$) => string | Promise<string>;
}
export function registerHelloWorld(service: HelloWorldDef): void;
export function registerHelloWorld(serviceId: string, service: HelloWorldDef): void;
export function registerHelloWorld(peer: IFluenceClient$$, service: HelloWorldDef): void;
export function registerHelloWorld(peer: IFluenceClient$$, serviceId: string, service: HelloWorldDef): void;

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

export function helloTest(
    config?: {ttl?: number}
): Promise<string>;

export function helloTest(
    peer: IFluenceClient$$,
    config?: {ttl?: number}
): Promise<string>;

export function demo_calculation(
    service_id: string,
    config?: {ttl?: number}
): Promise<number>;

export function demo_calculation(
    peer: IFluenceClient$$,
    service_id: string,
    config?: {ttl?: number}
): Promise<number>;

export function marineTest(
    wasm64: string,
    config?: {ttl?: number}
): Promise<number>;

export function marineTest(
    peer: IFluenceClient$$,
    wasm64: string,
    config?: {ttl?: number}
): Promise<number>;

