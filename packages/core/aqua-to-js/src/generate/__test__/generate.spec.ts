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
import fs from 'fs/promises';
import { generateTypes, generateSources } from '../index.js';
import { compileFromPath } from '@fluencelabs/aqua-api';
import url from 'url';
import { getPackageJsonContent, PackageJson } from '../../utils.js';

function replacePackageTypes(generated: string, pkg: PackageJson) {
    return generated
        .replace('@fluencelabs/aqua-api version: 0.0.0', '@fluencelabs/aqua-api version: ' + pkg.devDependencies['@fluencelabs/aqua-api'])
        .replace('@fluencelabs/aqua-to-js version: 0.0.0', '@fluencelabs/aqua-to-js version: ' + pkg.version);
}

describe('Aqua to js/ts compiler', () => {
    it('compiles smoke tests successfully', async () => {
        const res = await compileFromPath({
            filePath: url.fileURLToPath(new URL('./sources/smoke_test.aqua', import.meta.url)),
            imports: ['./node_modules'],
            targetType: 'air'
        });
        
        const pkg = await getPackageJsonContent();
        
        const jsResult = await generateSources(res, 'js');
        const jsTypes = await generateTypes(res);
        
        const jsSnapshot = await fs.readFile(new URL('./snapshots/smoke_test.js', import.meta.url), 'utf-8');
        const jsSnapshotTypes = await fs.readFile(new URL('./snapshots/smoke_test.d.ts', import.meta.url), 'utf-8');
        
        expect(jsResult).toEqual(replacePackageTypes(jsSnapshot, pkg));
        expect(jsTypes).toEqual(replacePackageTypes(jsSnapshotTypes, pkg));

        const tsResult = await generateSources(res, 'ts');
        const tsSnapshot = await fs.readFile(new URL('./snapshots/smoke_test.ts', import.meta.url), 'utf-8');

        expect(tsResult).toEqual(replacePackageTypes(tsSnapshot, pkg));
    });
});