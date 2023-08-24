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

import { fetchResource as fetchResourceBrowser } from './browser.js';
import { fetchResource as fetchResourceNode } from './node.js';
import process from 'process';

const isNode = typeof process !== 'undefined' && process?.release?.name === 'node';

export async function fetchResource(assetPath: string, version: string) {
    switch (true) {
        case isNode:
            return fetchResourceNode(assetPath, version);
        default:
            return fetchResourceBrowser(assetPath, version);
    }
}
