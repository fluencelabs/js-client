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
} from "@fluencelabs/interfaces";

import { ParticleContext } from "../jsServiceHost/interfaces.js";

import { ServiceImpl } from "./types.js";

class SchemaValidationError extends Error {
  constructor(
    public path: string[],
    schema: NonArrowSimpleType,
    expected: string,
    provided: JSONValue,
  ) {
    const given =
      provided === null
        ? "null"
        : Array.isArray(provided)
        ? "array"
        : typeof provided;

    const message = `Type mismatch. Path: ${path.join(
      ".",
    )}; Expected: ${expected}; Given: ${given};\n\nschema: ${JSON.stringify(
      schema,
    )}`;

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
    throw new SchemaValidationError(path, schema, "never", arg);
  }

  return arg;
}

export function aqua2ts(
  value: JSONValue,
  schema: NonArrowSimpleType,
): JSONValue {
  if (schema.tag === "nil") {
    return null;
  } else if (schema.tag === "option") {
    if (!Array.isArray(value)) {
      throw new Error("Value and schema doesn't match");
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
      throw new Error("Value and schema doesn't match");
    }

    return value.map((y) => {
      return aqua2ts(y, schema.type);
    });
  } else if (schema.tag === "unlabeledProduct") {
    if (!Array.isArray(value)) {
      throw new Error("Value and schema doesn't match");
    }

    return value.map((y, i) => {
      return aqua2ts(y, schema.items[i]);
    });
  } else if (["labeledProduct", "struct"].includes(schema.tag)) {
    if (typeof value !== "object" || value == null || Array.isArray(value)) {
      throw new Error("Value and schema doesn't match");
    }

    return Object.entries(schema.fields).reduce((agg, [key, type]) => {
      const val = aqua2ts(value[key], type);
      return { ...agg, [key]: val };
    }, {});
  } else {
    throw new Error("Unexpected tag: " + JSON.stringify(schema));
  }
}

export function ts2aqua(
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
    return value == null ? [] : [ts2aqua(value, schema.type, { path })];
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
      return ts2aqua(y, schema.type, { path: [...path, `[${i}]`] });
    });
  } else if (schema.tag === "unlabeledProduct") {
    if (!Array.isArray(value)) {
      throw new SchemaValidationError(path, schema, "array", value);
    }

    return value.map((y, i) => {
      return ts2aqua(y, schema.items[i], { path: [...path, `[${i}]`] });
    });
  } else if (["labeledProduct", "struct"].includes(schema.tag)) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new SchemaValidationError(path, schema, "object", value);
    }

    return Object.entries(schema.fields).reduce((agg, [key, type]) => {
      const val = ts2aqua(value[key], type, { path: [...path, key] });
      return { ...agg, [key]: val };
    }, {});
  } else {
    throw new SchemaValidationError(path, schema, "never", value);
  }
}

export const wrapFunction = (
  value: ServiceImpl[string],
  schema: ArrowWithoutCallbacks | ArrowType<LabeledProductType<SimpleTypes>>,
): ServiceImpl[string] => {
  return async (...args) => {
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
        `Schema and generated air doesn't match. Air have been called with ${jsonArgs.length} args and schema contains ${schemaArgs.length} args`,
      );
    }

    const tsArgs = jsonArgs.map((arg, i) => {
      return aqua2ts(arg, schemaArgs[i]);
    });

    const result = await value(...tsArgs, context);

    const resultSchema =
      schema.codomain.tag === "unlabeledProduct" &&
      schema.codomain.items.length === 1
        ? schema.codomain.items[0]
        : schema.codomain;

    return ts2aqua(result, resultSchema, { path: [] });
  };
};
