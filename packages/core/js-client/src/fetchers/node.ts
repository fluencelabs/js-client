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

import fs from 'fs';
import url from 'url';
import path from 'path';

export async function fetchResource(assetPath: string, version: string) {
    const file = await new Promise<ArrayBuffer>((resolve, reject) => {
        // Cannot use 'fs/promises' with current vite config. This module is not polyfilled by default.
        const root = path.dirname(url.fileURLToPath(import.meta.url));
        const workerFilePath = path.join(root, '..', assetPath);
        fs.readFile(workerFilePath, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(data);
        });
    }); 
    return new Response(file, {
        headers: {
            'Content-type':
                assetPath.endsWith('.wasm')
                    ? 'application/wasm'
                    : assetPath.endsWith('.js')
                        ? 'application/javascript'
                        : 'application/text'
        }
    });
}