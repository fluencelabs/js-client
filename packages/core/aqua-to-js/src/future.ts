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
    BottomType,
    LabeledProductType,
    NilType,
    NonArrowType,
    OptionType,
    ScalarType,
    StructType,
    TopType,
    UnlabeledProductType,
} from "@fluencelabs/interfaces";

// Type definitions for inferring ts types from air json definition
// In the future we may remove string type declaration and move to type inference.

type GetTsTypeFromScalar<T extends ScalarType> = T["name"] extends
    | "u8"
    | "u16"
    | "u32"
    | "u64"
    | "i8"
    | "i16"
    | "i32"
    | "i64"
    | "f32"
    | "f64"
    ? number
    : T["name"] extends "bool"
    ? boolean
    : T["name"] extends "string"
    ? string
    : never;

type MapTuple<T> = {
    [K in keyof T]: T[K] extends NonArrowType ? GetTsType<T[K]> : never;
};

type GetTsType<T extends NonArrowType> = T extends NilType
    ? null
    : T extends ArrayType
    ? GetTsType<T["type"]>[]
    : T extends StructType
    ? { [K in keyof T]: GetTsType<T> }
    : T extends OptionType
    ? GetTsType<T["type"]> | null
    : T extends ScalarType
    ? GetTsTypeFromScalar<T>
    : T extends TopType
    ? unknown
    : T extends BottomType
    ? never
    : T extends Exclude<UnlabeledProductType<infer H>, NilType>
    ? MapTuple<H>
    : T extends Exclude<LabeledProductType<infer H>, NilType>
    ? H extends NonArrowType
        ? { [K in keyof T["fields"]]: GetTsType<H> }
        : never
    : never;
