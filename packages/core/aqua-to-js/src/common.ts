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

import { ArrowType, NonArrowType } from "@fluencelabs/interfaces";
import { match, P } from "ts-pattern";

import { getFuncArgs } from "./utils.js";

export function genTypeName(
  t: NonArrowType | ArrowType,
  name: string,
): readonly [string | undefined, string] {
  const genType = typeToTs(t);
  return match(t)
    .with({ tag: "nil" }, () => {
      return [undefined, "void"] as const;
    })
    .with({ tag: "struct" }, () => {
      return [`export type ${name} = ${genType}`, name] as const;
    })
    .with({ tag: P.union("labeledProduct", "unlabeledProduct") }, (item) => {
      const args =
        item.tag === "labeledProduct" ? Object.values(item.fields) : item.items;

      if ("0" in args) {
        return genTypeName(args[0], name);
      }

      return [`export type ${name} = ${genType}`, name] as const;
    })
    .otherwise(() => {
      return [undefined, genType] as const;
    });
}

export function typeToTs(t: NonArrowType | ArrowType): string {
  return match(t)
    .with({ tag: "nil" }, () => {
      return "null";
    })
    .with({ tag: "option" }, ({ type }) => {
      return typeToTs(type) + " | null";
    })
    .with({ tag: "scalar" }, ({ name }) => {
      return match(name)
        .with(
          P.union(
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
          ),
          () => {
            return "number";
          },
        )
        .with("bool", () => {
          return "boolean";
        })
        .with("string", () => {
          return "string";
        })
        .with(P._, () => {
          return "any";
        })
        .exhaustive();
    })
    .with({ tag: "array" }, ({ type }) => {
      return typeToTs(type) + "[]";
    })
    .with({ tag: "struct" }, ({ fields }) => {
      return `{ ${Object.entries(fields)
        .map(([field, type]) => {
          return `${field}: ${typeToTs(type)};`;
        })
        .join(" ")} }`;
    })
    .with({ tag: "labeledProduct" }, ({ fields }) => {
      return `{ ${Object.entries(fields)
        .map(([field, type]) => {
          return `${field}: ${typeToTs(type)};`;
        })
        .join(" ")} }`;
    })
    .with({ tag: "unlabeledProduct" }, ({ items }) => {
      return `[${items
        .map((item) => {
          return typeToTs(item);
        })
        .join(", ")}]`;
    })
    .with({ tag: "arrow" }, ({ domain, codomain }) => {
      const retType =
        codomain.tag === "nil"
          ? "void"
          : "0" in codomain.items
          ? typeToTs(codomain.items[0])
          : typeToTs(codomain);

      const args = getFuncArgs(domain).map(([name, type]) => {
        return [name, typeToTs(type)];
      });

      args.push(["callParams", `ParticleContext$$`]);

      const funcArgs = args
        .map(([name, type]) => {
          return `${name}: ${type}`;
        })
        .join(", ");

      return `(${funcArgs}) => ${retType} | Promise<${retType}>`;
    })
    .with({ tag: "topType" }, () => {
      return "unknown";
    })
    .with({ tag: "bottomType" }, () => {
      return "never";
    })
    .exhaustive();
}
