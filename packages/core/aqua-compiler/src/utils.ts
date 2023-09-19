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

import { ArrowWithoutCallbacks, NonArrowType, ProductType } from '@fluencelabs/interfaces';
import { readFile } from 'fs/promises';
import path from 'path';

interface PackageJson {
    version: string;
    dependencies: {
        ['@fluencelabs/aqua-api']: string
    }
}

export async function getPackageJsonContent(): Promise<PackageJson> {
    const content = await readFile(new URL(path.join('..', 'package.json'), import.meta.url));
    const pkg = JSON.parse(content.toString());
    return pkg;
}

export function getFuncArgs(domain: ProductType<NonArrowType | ArrowWithoutCallbacks>): [string, NonArrowType | ArrowWithoutCallbacks][] {
    if (domain.tag === 'labeledProduct') {
        return Object.entries(domain.fields).map(([label, type]) => [label, type]);
    } else if (domain.tag === 'unlabeledProduct') {
        return domain.items.map((type, index) => ['arg' + index, type]);
    } else {
        return [];
    }
}

export function recursiveRenameLaquaProps(obj: unknown): unknown {
    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => recursiveRenameLaquaProps(item));
    }

    return Object.getOwnPropertyNames(obj).reduce((acc, prop) => {
        let accessProp = prop;
        if (prop.includes('Laqua_js')) {
            // Last part of the property separated by "_" is a correct name 
            const refinedProperty = prop.split('_').pop()!;
            if (refinedProperty in obj) {
                accessProp = refinedProperty;
            }
        }

        return {
            ...acc,
            [accessProp]: recursiveRenameLaquaProps(obj[accessProp as keyof typeof obj])
        };
    }, {});
}

export function capitalize(str: string) {
    return str.slice(0, 1).toUpperCase() + str.slice(1);
}