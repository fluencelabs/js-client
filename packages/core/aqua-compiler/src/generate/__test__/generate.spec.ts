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

import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import generate from '../index.js';
import { compileFromPath } from '@fluencelabs/aqua-api';
import * as url from 'url';

describe('Aqua to js/ts compiler', () => {
    it('compiles smoke tests successfully', async () => {
        const res = await compileFromPath({
            filePath: url.fileURLToPath(new URL('./sources/smoke_test.aqua', import.meta.url)),
            imports: ['./node_modules'],
            targetType: 'air'
        });
        
        const jsResult = generate(res, 'js');
        const jsSnapshot = fs.readFileSync(new URL('./snapshots/smoke_test.js', import.meta.url))
        
        expect(jsResult).toEqual(jsSnapshot.toString());

        const tsResult = generate(res, 'ts');
        const tsSnapshot = fs.readFileSync(new URL('./snapshots/smoke_test.ts', import.meta.url))

        expect(tsResult).toEqual(tsSnapshot.toString());
    });
});