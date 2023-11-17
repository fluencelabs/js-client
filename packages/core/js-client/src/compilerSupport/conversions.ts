/**
 * Copyright 2023 Fluence Labs Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  ArrowType,
  ArrowWithoutCallbacks,
  JSONValue,
  LabeledProductType,
  NonArrowSimpleType,
  ScalarType,
  SimpleTypes,
  UnlabeledProductType,
} from "@fluencelabs/interfaces";

import { ParticleContext } from "../jsServiceHost/interfaces.js";

import { ServiceImpl } from "./types.js";

export class SchemaValidationError extends Error {
  constructor(
    public path: string[],
    schema: NonArrowSimpleType | ArrowWithoutCallbacks,
    expected: string,
    provided: JSONValue | ServiceImpl[string],
  ) {
    const given =
      provided === null
        ? "null"
        : Array.isArray(provided)
        ? "array"
        : typeof provided;

    const message = `Aqua and schema type mismatch. Path: ${path.join(
      ".",
    )}; Expected: ${expected}; Given: ${given};\n\nschema: ${JSON.stringify(
      schema,
    )}; Try to recompile rust services and aqua and make sure that you are using up-to-date versions of aqua libraries`;

    super(message);
  }
}

interface ValidationContext {
  path: string[];
}

const numberTypes = [
  "u8",
  "u16",
  "u32",
  "u64",
  "i8",
  "i16",
  "i32",
  "i64",
  "f32",
  "f64",
] as const;

function isScalar(
  schema: ScalarType,
  arg: JSONValue,
  { path }: ValidationContext,
) {
  if (numberTypes.includes(schema.name)) {
    if (typeof arg !== "number") {
      throw new SchemaValidationError(path, schema, "number", arg);
    }
  } else if (schema.name === "bool") {
    if (typeof arg !== "boolean") {
      throw new SchemaValidationError(path, schema, "boolean", arg);
    }
  } else if (schema.name === "string") {
    if (typeof arg !== "string") {
      throw new SchemaValidationError(path, schema, "string", arg);
    }
  } else {
    throw new SchemaValidationError(path, schema, schema.name, arg);
  }

  return arg;
}

export function aqua2js(
  value: JSONValue,
  schema: NonArrowSimpleType,
): JSONValue {
  if (schema.tag === "nil") {
    return null;
  } else if (schema.tag === "option") {
    if (!Array.isArray(value)) {
      throw new SchemaValidationError([], schema, "array", value);
    }

    if (value.length === 0) {
      return null;
    } else {
      return aqua2js(value[0], schema.type);
    }
  } else if (
    schema.tag === "scalar" ||
    schema.tag === "bottomType" ||
    schema.tag === "topType"
  ) {
    return value;
  } else if (schema.tag === "array") {
    if (!Array.isArray(value)) {
      throw new SchemaValidationError([], schema, "array", value);
    }

    return value.map((y) => {
      return aqua2js(y, schema.type);
    });
  } else if (schema.tag === "unlabeledProduct") {
    if (!Array.isArray(value)) {
      throw new SchemaValidationError([], schema, "array", value);
    }

    return value.map((y, i) => {
      return aqua2js(y, schema.items[i]);
    });
  } else if (["labeledProduct", "struct"].includes(schema.tag)) {
    if (typeof value !== "object" || value == null || Array.isArray(value)) {
      throw new SchemaValidationError([], schema, "object", value);
    }

    return Object.fromEntries(
      Object.entries(schema.fields).map(([key, type]) => {
        const val = aqua2js(value[key], type);
        return [key, val];
      }),
    );
  } else {
    throw new SchemaValidationError([], schema, "never", value);
  }
}

export function js2aqua(
  value: JSONValue,
  schema: NonArrowSimpleType,
  { path }: ValidationContext,
): JSONValue {
  if (schema.tag === "nil") {
    if (value !== null) {
      throw new SchemaValidationError(path, schema, "null", value);
    }

    return value;
  } else if (schema.tag === "option") {
    // option means 'type | null'
    return value == null ? [] : [js2aqua(value, schema.type, { path })];
  } else if (schema.tag === "topType") {
    // topType equals to 'any'
    return value;
  } else if (schema.tag === "bottomType") {
    // bottomType equals to 'never'
    throw new SchemaValidationError(path, schema, "never", value);
  } else if (schema.tag === "scalar") {
    return isScalar(schema, value, { path });
  } else if (schema.tag === "array") {
    if (!Array.isArray(value)) {
      throw new SchemaValidationError(path, schema, "array", value);
    }

    return value.map((y, i) => {
      return js2aqua(y, schema.type, { path: [...path, `[${i}]`] });
    });
  } else if (schema.tag === "unlabeledProduct") {
    if (!Array.isArray(value)) {
      throw new SchemaValidationError(path, schema, "array", value);
    }

    return value.map((y, i) => {
      return js2aqua(y, schema.items[i], { path: [...path, `[${i}]`] });
    });
  } else if (["labeledProduct", "struct"].includes(schema.tag)) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new SchemaValidationError(path, schema, "object", value);
    }

    return Object.fromEntries(
      Object.entries(schema.fields).map(([key, type]) => {
        const val = js2aqua(value[key], type, { path: [...path, key] });
        return [key, val];
      }),
    );
  } else {
    throw new SchemaValidationError(path, schema, "never", value);
  }
}

// Wrapping function, converting its arguments to aqua before call and back to js after call.
// It makes callbacks and service functions defined by user operate on js types seamlessly
export const wrapJsFunction = (
  func: ServiceImpl[string],
  schema:
    | ArrowWithoutCallbacks
    | ArrowType<LabeledProductType<SimpleTypes> | UnlabeledProductType>,
): ServiceImpl[string] => {
  return async (...args) => {
    // These assertions used to correctly destructure tuple. It's impossible to do without asserts due to ts limitations.
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const jsonArgs = args.slice(0, args.length - 1) as JSONValue[];
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const context = args[args.length - 1] as ParticleContext;

    const schemaArgs =
      schema.domain.tag === "nil"
        ? []
        : schema.domain.tag === "unlabeledProduct"
        ? schema.domain.items
        : Object.values(schema.domain.fields);

    if (schemaArgs.length !== jsonArgs.length) {
      throw new Error(
        `Schema and generated air doesn't match. Air has been called with ${jsonArgs.length} args and schema contains ${schemaArgs.length} args`,
      );
    }

    const tsArgs = jsonArgs.map((arg, i) => {
      return aqua2js(arg, schemaArgs[i]);
    });

    const returnTypeVoid =
      schema.codomain.tag === "nil" || schema.codomain.items.length === 0;

    const resultSchema =
      schema.codomain.tag === "unlabeledProduct" &&
      schema.codomain.items.length === 1
        ? schema.codomain.items[0]
        : schema.codomain;

    let result = await func(...tsArgs, context);

    if (returnTypeVoid) {
      result = null;
    }

    return js2aqua(result, resultSchema, { path: [] });
  };
};
