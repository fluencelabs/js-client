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
  SimpleTypes,
} from "@fluencelabs/interfaces";

import { ParticleContext } from "../jsServiceHost/interfaces.js";

import { ServiceImpl } from "./types.js";

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
): JSONValue {
  if (schema.tag === "nil") {
    return null;
  } else if (schema.tag === "option") {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return value == null ? [] : ([ts2aqua(value, schema.type)] as [JSONValue]);
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
      return ts2aqua(y, schema.type);
    });
  } else if (schema.tag === "unlabeledProduct") {
    if (!Array.isArray(value)) {
      throw new Error("Value and schema doesn't match");
    }

    return value.map((y, i) => {
      return ts2aqua(y, schema.items[i]);
    });
  } else if (["labeledProduct", "struct"].includes(schema.tag)) {
    if (typeof value !== "object" || value == null || Array.isArray(value)) {
      throw new Error("Value and schema doesn't match");
    }

    return Object.entries(schema.fields).reduce((agg, [key, type]) => {
      const val = ts2aqua(value[key], type);
      return { ...agg, [key]: val };
    }, {});
  } else {
    throw new Error("Unexpected tag: " + JSON.stringify(schema));
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

    const tsArgs = jsonArgs.map((arg, i) => {
      return aqua2ts(arg, schemaArgs[i]);
    });

    const result = await value(...tsArgs, context);

    const resultSchema =
      schema.codomain.tag === "unlabeledProduct" &&
      schema.codomain.items.length === 1
        ? schema.codomain.items[0]
        : schema.codomain;

    return ts2aqua(result, resultSchema);
  };
};
