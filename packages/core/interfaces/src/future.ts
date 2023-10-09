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
    ArrayType,
    ArrowType,
    LabeledProductType,
    NilType,
    OptionType,
    ScalarType,
    SimpleTypes,
    StructType,
    TopType,
    UnlabeledProductType,
} from "@fluencelabs/interfaces";
import { Call, Pipe, Objects, Tuples, Unions, Fn } from "hotscript";

// Type definitions for inferring ts types from air json definition
// In the future we may remove string type declaration and move to type inference.

type GetTsTypeFromScalar<T extends ScalarType> = [T["name"]] extends [
    "u8" | "u16" | "u32" | "u64" | "i8" | "i16" | "i32" | "i64" | "f32" | "f64",
]
    ? number
    : [T["name"]] extends ["bool"]
    ? boolean
    : [T["name"]] extends ["string"]
    ? string
    : never;

type MapTuple<T> = {
    [K in keyof T]: [T[K]] extends [SimpleTypes] ? GetSimpleType<T[K]> : never;
};

type UnpackIfSingle<T> = [T] extends [[infer R]] ? R : T;

type GetSimpleType<T> = [T] extends [NilType]
    ? null
    : [T] extends [ArrayType]
    ? GetSimpleType<T["type"]>[]
    : [T] extends [StructType]
    ? { [K in keyof T["fields"]]: GetSimpleType<T["fields"][K]> }
    : [T] extends [OptionType]
    ? GetSimpleType<T["type"]> | null
    : [T] extends [ScalarType]
    ? GetTsTypeFromScalar<T>
    : [T] extends [TopType]
    ? unknown
    : never;

interface Access<T> extends Fn {
    return: __GetTsType<Call<Objects.Get<this["arg0"]>, T>>;
}

type __GetTsType<T> = [T] extends [SimpleTypes]
    ? GetSimpleType<T>
    : [T] extends [UnlabeledProductType]
    ? MapTuple<T["items"]>
    : [T] extends [LabeledProductType]
    ? { [K in keyof T["fields"]]: __GetTsType<T["fields"][K]> }
    : [T] extends [ArrowType<infer H>]
    ? (
          ...t: [H] extends [UnlabeledProductType<infer K>]
              ? MapTuple<K>
              : [H] extends [LabeledProductType<infer _V, infer K>]
              ? Pipe<K, [Objects.Keys, Unions.ToTuple, Tuples.Map<Access<K>>]>
              : []
      ) => [T["codomain"]] extends [UnlabeledProductType]
          ? UnpackIfSingle<MapTuple<T["codomain"]["items"]>>
          : undefined
    : never;

type DeepMutable<T> = {
    -readonly [K in keyof T]: DeepMutable<T[K]>;
};

export type GetTsType<T> = __GetTsType<DeepMutable<T>>;
