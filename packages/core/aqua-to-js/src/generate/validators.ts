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
  ArrowWithoutCallbacks,
  FunctionCallDef,
  JSONValue,
  SimpleTypes,
  UnlabeledProductType,
} from "@fluencelabs/interfaces";

import { typeToTs } from "../common.js";

export function validateFunctionCall(
  schema: FunctionCallDef,
  ...args: JSONValue[]
) {
  const schemaArgs =
    schema.arrow.domain.tag === "nil"
      ? []
      : Object.values(schema.arrow.domain.fields);

  if (args.length !== schemaArgs.length) {
    throw new Error(
      `Expected ${schemaArgs.length} arguments but provided ${args.length}`,
    );
  }

  for (let i = 0; i < args.length; i++) {
    validateFunctionCallArg(schemaArgs[i], args[i], i + 1);
  }
}

export function validateFunctionCallArg(
  schema: SimpleTypes | UnlabeledProductType | ArrowWithoutCallbacks,
  arg: JSONValue,
  argIndex: number,
) {
  if (!isTypeMatchesSchema(schema, arg)) {
    const expectedType = typeToTs(schema);
    throw new Error(
      `Argument ${argIndex} doesn't match schema. Expected type: ${expectedType}`,
    );
  }
}

export function isTypeMatchesSchema(
  schema: SimpleTypes | UnlabeledProductType | ArrowWithoutCallbacks,
  arg: JSONValue,
): boolean {
  if (schema.tag === "nil") {
    return arg === null;
  } else if (schema.tag === "option") {
    return arg === null || isTypeMatchesSchema(schema.type, arg);
  } else if (schema.tag === "scalar") {
    if (
      [
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
      ].includes(schema.name)
    ) {
      return typeof arg === "number";
    } else if (schema.name === "bool") {
      return typeof arg === "boolean";
    } else if (schema.name === "string") {
      return typeof arg === "string";
    } else {
      // Should not be possible
      return false;
    }
  } else if (schema.tag === "array") {
    return (
      Array.isArray(arg) &&
      arg.every((item) => {
        return isTypeMatchesSchema(schema.type, item);
      })
    );
  } else if (schema.tag === "struct") {
    return (
      !Array.isArray(arg) &&
      typeof arg === "object" &&
      arg !== null &&
      Object.entries(schema.fields).every(([field, type]) => {
        return isTypeMatchesSchema(type, arg[field]);
      })
    );
  } else if (schema.tag === "unlabeledProduct") {
    return (
      Array.isArray(arg) &&
      arg.every((item, index) => {
        return isTypeMatchesSchema(schema.items[index], item);
      })
    );
  } else if (schema.tag === "arrow") {
    return typeof arg === "function";
  } else {
    return schema.tag === "topType";
  }
}
