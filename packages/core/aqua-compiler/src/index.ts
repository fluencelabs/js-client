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

import {
    generateSources,
    generateTypes,
} from './generate/index.js';
import { compileFromPath } from '@fluencelabs/aqua-api';

type InputSource = 'file' | 'string';

type OutputType = 'js' | 'ts';

interface JsOutput {
    sources: string;
    types: string;
}

interface TsOutput {
    sources: string;
}

type LanguageOutput = JsOutput | TsOutput;

const res = await compileFromPath({
    filePath: './src/generate/__test__/sources/smoke_test.aqua',
    imports: ['./node_modules']
});

const content = await generateTypes(res);
console.log();
process.exit();

export default async function(src: InputSource, outputType: OutputType): Promise<LanguageOutput> {
    const res = await compileFromPath({
        filePath: './src/generate/__test__/sources/smoke_test.aqua',
        imports: ['./node_modules']
    });
    
    console.log(generateTypes(res));
    process.exit();
    
    if (outputType === 'js') {
        return {
            sources: await generateSources(res, 'js'),
            types: await generateTypes(res)
        }
    } else {
        return {
            sources: await generateSources(res, 'ts'),
        }
    }
};