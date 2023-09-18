/*
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

// @ts-nocheck

import { compileFromPath } from '@fluencelabs/aqua-api';
import type { ArrowType, LabeledProductType, ProductType, ServiceDef } from '@fluencelabs/interfaces';
import assert from 'assert';
import { match, P } from 'ts-pattern';
import {
    ArrayType,
    BottomType,
    NilType,
    NonArrowType,
    OptionType,
    ScalarType,
    StructType,
    TopType,
    UnlabeledProductType
} from '@fluencelabs/interfaces';
import * as fs from 'fs';
import generate from './generate/index.js';

const res = await compileFromPath({
    filePath: './src/generate/__test__/sources/abilities.aqua',
    imports: ['./node_modules'],
    targetType: 'ts'
});

// const data = generate(res, 'ts');

fs.writeFileSync('./src/generate/__test__/snapshots/abilities.ts', res.generatedSources[0].tsSource);


process.exit();


type GetTsTypeFromScalar<T extends ScalarType> = T['name'] extends 'u8' | 'u16' | 'u32' | 'u64' | 'i8' | 'i16' | 'i32' | 'i64' | 'f32' | 'f64'
    ? number
    : T['name'] extends 'bool'
        ? boolean
        : T['name'] extends 'string'
            ? string
            : never;

type MapTuple<T> = { [K in keyof T]: T[K] extends NonArrowType ? GetTsType<T[K]> : never }

type GetTsType<T extends NonArrowType> = T extends NilType 
    ? null
    : T extends ArrayType
        ? GetTsType<T['type']>[]
        : T extends StructType
            ? { [K in keyof T]: GetTsType<T> }
            : T extends OptionType
                ? GetTsType<T['type']> | null
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
                                        ? { [K in keyof T['fields']]: GetTsType<H> }
                                        : never
                                    : never;
                                


const struct = {
    "tag" : "unlabeledProduct",
    "items" : [
        {
            "tag" : "struct",
            "name" : "RemoveResult",
            "fields" : {
                "error" : {
                    "tag" : "option",
                    "type" : {
                        "tag" : "scalar",
                        "name" : "string"
                    }
                },
                "success" : {
                    "tag" : "scalar",
                    "name" : "bool"
                }
            }
        }
    ] as Array<SomeNonArrowTypes>
} as const;

type tt = GetTsType<typeof struct>;

const services = res.services as Record<string, ServiceDef>

const service = services['Srv'];

if (service.functions.tag === 'nil') {
    throw new Error('nil');
}

const codomain = service.functions.fields['reload'].domain;
console.log(service.functions);
console.log(service);
// console.log(codomain);
// assert(codomain.tag === 'labeledProduct');
console.log(JSON.stringify(codomain));