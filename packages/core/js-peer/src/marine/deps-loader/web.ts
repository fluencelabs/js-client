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
import { Buffer } from 'buffer';
import { LazyLoader } from '../interfaces.js';
// @ts-ignore
import type { WorkerImplementation } from 'threads/dist/types/master';

const bufferToSharedArrayBuffer = (buffer: Buffer): SharedArrayBuffer => {
    const sab = new SharedArrayBuffer(buffer.length);
    const tmp = new Uint8Array(sab);
    tmp.set(buffer, 0);
    return sab;
};

/**
 * Load wasm file from the server. Only works in browsers.
 * The function will try load file into SharedArrayBuffer if the site is cross-origin isolated.
 * Otherwise the return value fallbacks to Buffer which is less performant but is still compatible with FluenceAppService methods.
 * We strongly recommend to set-up cross-origin headers. For more details see: See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements
 * Filename is relative to current origin.
 * @param filePath - path to the wasm file relative to current origin
 * @returns Either SharedArrayBuffer or Buffer with the wasm file
 */
export const loadWasmFromUrl = async (filePath: string): Promise<SharedArrayBuffer | Buffer> => {
    const fullUrl = window.location.origin + '/' + filePath;
    const res = await fetch(fullUrl);
    const ab = await res.arrayBuffer();
    new Uint8Array(ab);
    const buffer = Buffer.from(ab);

    // only convert to shared buffers if necessary CORS headers have been set:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements
    if (crossOriginIsolated) {
        return bufferToSharedArrayBuffer(buffer);
    }

    return buffer;
};

export class WasmLoaderFromUrl extends LazyLoader<SharedArrayBuffer | Buffer> {
    constructor(filePath: string) {
        super(() => loadWasmFromUrl(filePath));
    }
}

export class WorkerLoaderFromUrl extends LazyLoader<WorkerImplementation> {
    constructor(scriptPath: string) {
        super(() => new Worker(scriptPath));
    }
}
