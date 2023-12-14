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

import assert from "assert";
import { readFile } from "fs/promises";
import { join } from "path";

import {
  ArrowType,
  ArrowWithoutCallbacks,
  JSONValue,
  LabeledProductType,
  NilType,
  SimpleTypes,
  UnlabeledProductType,
} from "@fluencelabs/interfaces";
import { z } from "zod";

const packageJsonSchema = z.object({
  name: z.string(),
  version: z.string(),
  devDependencies: z.object({
    // @fluencelabs/aqua-api version is included as part of the comment at the top of each js and ts file
    ["@fluencelabs/aqua-api"]: z.string(),
  }),
});

export type PackageJson = z.infer<typeof packageJsonSchema>;

export async function getPackageJsonContent(): Promise<PackageJson> {
  const content = await readFile(
    new URL(join("..", "package.json"), import.meta.url),
    "utf-8",
  );

  return packageJsonSchema.parse(JSON.parse(content));
}

export function getFuncArgs(
  domain:
    | LabeledProductType<SimpleTypes | ArrowType<UnlabeledProductType>>
    | UnlabeledProductType
    | NilType,
): [string, SimpleTypes | ArrowWithoutCallbacks][] {
  if (domain.tag === "labeledProduct") {
    return Object.entries(domain.fields).map(([label, type]) => {
      return [label, type];
    });
  } else if (domain.tag === "unlabeledProduct") {
    return domain.items.map((type, index) => {
      return ["arg" + index, type];
    });
  } else {
    return [];
  }
}

export function recursiveRenameLaquaProps(obj: JSONValue): unknown {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => {
      return recursiveRenameLaquaProps(item);
    });
  }

  return Object.getOwnPropertyNames(obj).reduce((acc, prop) => {
    let accessProp = prop;

    if (prop.includes("Laqua_js")) {
      // Last part of the property separated by "_" is a correct name
      const refinedProperty = prop.split("_").pop();

      if (refinedProperty === undefined) {
        throw new Error(`Bad property name: ${prop}.`);
      }

      if (refinedProperty in obj) {
        accessProp = refinedProperty;
      }
    }

    const laquaProp = obj[accessProp];
    assert(laquaProp);

    return {
      ...acc,
      [accessProp]: recursiveRenameLaquaProps(laquaProp),
    };
  }, {});
}

export function capitalize(str: string) {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}
