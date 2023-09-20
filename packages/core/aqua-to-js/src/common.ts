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

import { ArrowType, ArrowWithoutCallbacks, NonArrowType, ProductType } from '@fluencelabs/interfaces';
import { match, P } from 'ts-pattern';
import { getFuncArgs } from './utils.js';

export function genTypeName(t: NonArrowType | ProductType<NonArrowType> | ArrowWithoutCallbacks, name: string): readonly [string | undefined, string] {
    const genType = typeToTs(t);
    return match(t)
        .with(
            { tag: 'nil' },
            () => [undefined, 'void'] as const
        ).with(
            { tag: 'struct' },
            () => [`export type ${name} = ${genType}`, name] as const
        ).with(
            { tag: P.union('labeledProduct', 'unlabeledProduct') },
            (item) => {
                const args = item.tag === 'labeledProduct' 
                    ? Object.values(item.fields) 
                    : item.items;
                
                if (args.length === 1) {
                    return genTypeName(args[0], name);
                }

                return [`export type ${name} = ${genType}`, name] as const;
            },
        ).otherwise(() => [undefined, genType] as const);
}

export function typeToTs(t: NonArrowType | ArrowWithoutCallbacks | ProductType<NonArrowType>): string {
    return match(t)
        .with(
            { tag: 'nil' },
            () => 'null'
        ).with(
            { tag: 'option' },
            ({ type }) => typeToTs(type) + ' | null'
        ).with(
            { tag: 'scalar' },
            ({ name }) => match(name)
                .with(P.union('u8', 'u16', 'u32', 'u64', 'i8', 'i16', 'i32', 'i64', 'f32', 'f64'), () => 'number')
                .with('bool', () => 'boolean')
                .with('string', () => 'string')
                .with(P._, () => 'any').exhaustive()
        ).with(
            { tag: 'array' },
            ({ type }) => typeToTs(type) + '[]'
        ).with(
            { tag: 'struct' },
            ({ fields }) => `{ ${Object.entries(fields).map(([field, type]) => `${field}: ${typeToTs(type)};`).join(' ')} }`
        ).with(
            { tag: 'labeledProduct' },
            ({ fields }) => `{ ${Object.entries(fields).map(([field, type]) => `${field}: ${typeToTs(type)};`).join(' ')} }`
        ).with(
            { tag: 'unlabeledProduct' },
            ({ items }) => `[${items.map(item => typeToTs(item)).join(', ')}]`
        ).with(
            { tag: 'arrow' },
            ({ tag, domain, codomain }) => {
                const retType = codomain.tag === 'nil' 
                    ? 'void' 
                    : codomain.items.length === 1 
                        ? typeToTs(codomain.items[0]) 
                        : typeToTs(codomain);
                
                const args = getFuncArgs(domain).map(([name, type]) => ([name, typeToTs(type)]));

                const generic = args.length === 0 ? 'null' : args.map(([name]) => `'${name}'`).join(' | ');
                args.push(['callParams', `CallParams$$<${generic}>`]);

                const funcArgs = args.map(([name, type]) => `${name}: ${type}`).join(', ');

                return `(${funcArgs}) => ${retType} | Promise<${retType}>`;
            }
        ).with(
            { tag: 'topType' },
            () => 'unknown'
        ).with(
            { tag: 'bottomType' },
            () => 'never'
        ).exhaustive();
}