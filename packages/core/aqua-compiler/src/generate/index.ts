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

import { JSTypeGenerator, OutputType, TSTypeGenerator } from './interfaces.js';
import { getPackageJsonContent } from '../utils.js';
import { ServiceGenerator } from './service.js';
import { FunctionGenerator } from './function.js';
import { CompilationResult } from '@fluencelabs/aqua-api/aqua-api.js';
import header from './header.js';

export async function generateSources({ services, functions }: CompilationResult, outputType: OutputType) {
    const typeGenerator = outputType === 'js' ? new JSTypeGenerator() : new TSTypeGenerator();
    const { version, dependencies } = await getPackageJsonContent();
    return `/* eslint-disable */
// @ts-nocheck
${header(version, dependencies['@fluencelabs/aqua-api'], outputType)};

// Services
${new ServiceGenerator(typeGenerator).generate(services)}

// Functions
${new FunctionGenerator(typeGenerator).generate(functions)}

/* eslint-enable */
`
}

export async function generateTypes({ services, functions }: CompilationResult) {
    const typeGenerator = new TSTypeGenerator();
    const { version, dependencies } = await getPackageJsonContent();
    
    const generatedServices = Object.entries(services)
        .map(([srvName, srvDef]) => typeGenerator.serviceType(srvName, srvDef))
        .join('\n');
    
    const generatedFunctions = Object.entries(functions)
        .map(([funcName, funcDef]) => typeGenerator.funcType(funcDef))
        .join('\n');
    
    return `/* eslint-disable */
// @ts-nocheck
${header(version, dependencies['@fluencelabs/aqua-api'], 'ts')};

// Services
${generatedServices}

// Functions
${generatedFunctions}

/* eslint-enable */
`
}