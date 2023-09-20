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

import { CompilationResult, JSTypeGenerator, OutputType, TSTypeGenerator } from './interfaces.js';
import { PackageJson } from '../utils.js';
import { generateServices } from './service.js';
import { generateFunctions } from './function.js';
import header from './header.js';

export async function generateSources({ services, functions }: CompilationResult, outputType: OutputType, packageJson: PackageJson) {
    const typeGenerator = outputType === 'js' ? new JSTypeGenerator() : new TSTypeGenerator();
    const { version, devDependencies } = packageJson;
    return `${header(version, devDependencies['@fluencelabs/aqua-api'], outputType)}

${Object.entries(services).length > 0 ? `// Services
${generateServices(typeGenerator, services)}
` : ''}
${Object.entries(functions).length > 0 ? `// Functions
${generateFunctions(typeGenerator, functions)}
`: ''}`
}

export async function generateTypes({ services, functions }: CompilationResult, packageJson: PackageJson) {
    const typeGenerator = new TSTypeGenerator();
    const { version, devDependencies } = packageJson;
    
    const generatedServices = Object.entries(services)
        .map(([srvName, srvDef]) => typeGenerator.serviceType(srvName, srvDef))
        .join('\n');
    
    const generatedFunctions = Object.entries(functions)
        .map(([funcName, funcDef]) => typeGenerator.funcType(funcDef))
        .join('\n');
    
    return `${header(version, devDependencies['@fluencelabs/aqua-api'], 'ts')}

${Object.entries(services).length > 0 ? `// Services
${generatedServices}
` : ''}
${Object.entries(functions).length > 0 ? `// Functions
${generatedFunctions}
`: ''}`
}