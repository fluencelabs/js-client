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

import { AquaFunction } from '@fluencelabs/aqua-api/aqua-api.js';
import { recursiveRenameLaquaProps } from '../utils.js';
import { TypeGenerator } from './interfaces.js';

export class FunctionGenerator {
    constructor(
        private typeGenerator: TypeGenerator
    ) {}
    
    generate(functions: Record<string, AquaFunction>) {
        return Object.values(functions).map(func => this.generateFunction(func)).join('\n\n');
    }

    private generateFunction(func: AquaFunction) {
        const scriptConstName = func.funcDef.functionName + '_script';
        return `export const ${scriptConstName} = \`
${func.script}\`;

${this.typeGenerator.funcType(func)}
export function ${func.funcDef.functionName}(${this.typeGenerator.type('...args', 'any[]')}) {
    return callFunction$$(
        args,
        ${JSON.stringify(recursiveRenameLaquaProps(func.funcDef), null, 4)},
        ${scriptConstName}
    );
}`
    }
}