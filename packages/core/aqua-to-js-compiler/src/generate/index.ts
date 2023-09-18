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

import header from './header.js';
import { getAquaApiVersion, getPackageJsonContent } from '../utils.js';
import { FunctionGenerator } from './function.js';
import { CompilationResult } from '@fluencelabs/aqua-api/aqua-api.js';
import { JSTypeGenerator, TSTypeGenerator } from './interfaces.js';
import { ServiceGenerator } from './service.js'; 

type OutputType = 'js' | 'ts';

export default async function ({ services, functions }: CompilationResult, outputType: OutputType) {
    const typeGenerator = outputType === 'js' ? new JSTypeGenerator() : new TSTypeGenerator();
    const { version, dependencies } = await getPackageJsonContent();
    return `/* eslint-disable */
// @ts-nocheck
/**
 *
 * This file is auto-generated. Do not edit manually: changes may be erased.
 * Generated by Aqua compiler: https://github.com/fluencelabs/aqua/.
 * If you find any bugs in generated AIR, please write an issue on GitHub: https://github.com/fluencelabs/aqua/issues
 * If you find any bugs in generated JS/TS, please write an issue on GitHub: https://github.com/fluencelabs/js-client/issues
 * AIR generator version: ${dependencies['@fluencelabs/aqua-api']}
 * JS/TS generator version ${version}
 *
 */
${outputType === 'ts' ? 'import type { IFluenceClient as IFluenceClient$$, CallParams as CallParams$$ } from \'@fluencelabs/js-client\';' : ''}

import {
    v5_callFunction as callFunction$$,
    v5_registerService as registerService$$,
} from '@fluencelabs/js-client';

// Services
${new ServiceGenerator(typeGenerator).generate(services)}

// Functions
${new FunctionGenerator(typeGenerator).generate(functions)}

/* eslint-enable */
`
};