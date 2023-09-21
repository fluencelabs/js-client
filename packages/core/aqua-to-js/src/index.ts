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
import { CompilationResult, OutputType } from './generate/interfaces.js';
import { getPackageJsonContent } from './utils.js';

interface JsOutput {
    sources: string;
    types: string;
}

interface TsOutput {
    sources: string;
}

type LanguageOutput = {
    "js": JsOutput,
    "ts": TsOutput
};

export default async function aquaToJs<T extends OutputType>(res: CompilationResult, outputType: T): Promise<LanguageOutput[T]> {
    const packageJson = await getPackageJsonContent();
    
    return outputType === 'js' ? {
        sources: await generateSources(res, 'js', packageJson),
        types: await generateTypes(res, packageJson)
    } : {
        sources: await generateSources(res, 'ts', packageJson),
    } as LanguageOutput[T];
};