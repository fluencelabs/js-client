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
  LabeledProductType,
  NonArrowSimpleType,
  ScalarType,
  SimpleTypes,
  UnlabeledProductType,
} from "@fluencelabs/interfaces";

import { JSONValue } from "../util/types.js";
import { zip } from "../util/utils.js";

import { ServiceImpl, UserServiceImpl } from "./types.js";

export class SchemaValidationError extends Error {
  constructor(
    public path: string[],
    schema: NonArrowSimpleType | ArrowWithoutCallbacks,
    expected: string,
    provided: JSONValue | UserServiceImpl[string],
  ) {
    const given =
      provided === null
        ? "null"
        : Array.isArray(provided)
        ? "array"
        : typeof provided;

    const message = `Aqua type mismatch. Path: ${path.join(
      ".",
    )}; Expected: ${expected}; Given: ${given}; \nSchema: ${JSON.stringify(
      schema,
    )}; \nTry recompiling rust services and aqua. Make sure you are using up-to-date versions of aqua libraries`;

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
  { path }: ValidationContext,
): JSONValue {
  if (schema.tag === "nil") {
    return null;
  } else if (schema.tag === "option") {
    if (!Array.isArray(value) && value !== null) {
      throw new SchemaValidationError(path, schema, "array or null", value);
    }

    if (value !== null && "0" in value) {
      return aqua2js(value[0], schema.type, { path: [...path, "?"] });
    } else {
      return null;
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

    return value.map((y, i) => {
      return aqua2js(y, schema.type, { path: [...path, `[${i}]`] });
    });
  } else if (schema.tag === "unlabeledProduct") {
    if (!Array.isArray(value)) {
      throw new SchemaValidationError([], schema, "array", value);
    }

    return zip(value, schema.items).map(([v, s], i) => {
      return aqua2js(v, s, { path: [...path, `[${i}]`] });
    });
  } else if (["labeledProduct", "struct"].includes(schema.tag)) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new SchemaValidationError([], schema, "object", value);
    }

    return Object.fromEntries(
      Object.entries(schema.fields).map(([key, type]) => {
        let v = value[key];

        if (v === undefined) {
          v = null;
        }

        const val = aqua2js(v, type, { path: [...path, key] });
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
    return value === null
      ? []
      : [js2aqua(value, schema.type, { path: [...path, "?"] })];
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

    return zip(value, schema.items).map(([v, s], i) => {
      return js2aqua(v, s, { path: [...path, `[${i}]`] });
    });
  } else if (["labeledProduct", "struct"].includes(schema.tag)) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new SchemaValidationError(path, schema, "object", value);
    }

    return Object.fromEntries(
      Object.entries(schema.fields).map(([key, type]) => {
        let v = value[key];

        if (v === undefined) {
          v = null;
        }

        const val = js2aqua(v, type, { path: [...path, key] });
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
  func: UserServiceImpl[string],
  schema:
    | ArrowWithoutCallbacks
    | ArrowType<LabeledProductType<SimpleTypes> | UnlabeledProductType>,
  funcName: string,
): ServiceImpl[string] => {
  return async ({ args, context }) => {
    const schemaArgs =
      schema.domain.tag === "nil"
        ? []
        : schema.domain.tag === "unlabeledProduct"
        ? schema.domain.items
        : Object.values(schema.domain.fields);

    if (schemaArgs.length !== args.length) {
      throw new Error(
        `Schema and generated air doesn't match. Air has been called with ${args.length} args and schema contains ${schemaArgs.length} args`,
      );
    }

    const jsArgs = zip(args, schemaArgs).map(([arg, schemaArg], i) => {
      return aqua2js(arg, schemaArg, { path: [`${funcName}Args`, `[${i}]`] });
    });

    const returnTypeVoid =
      schema.codomain.tag === "nil" || schema.codomain.items.length === 0;

    const resultSchema =
      schema.codomain.tag === "unlabeledProduct" &&
      schema.codomain.items.length === 1 &&
      "0" in schema.codomain.items
        ? schema.codomain.items[0]
        : schema.codomain;

    let result = await func(...jsArgs, context);

    if (returnTypeVoid) {
      result = null;
    }

    return js2aqua(result, resultSchema, { path: [`${funcName}ReturnValue`] });
  };
};
