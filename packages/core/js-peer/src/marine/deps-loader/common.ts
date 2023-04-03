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
// @ts-ignore
import { BlobWorker } from 'threads';
import { fromBase64, toUint8Array } from 'js-base64';
// @ts-ignore
import type { WorkerImplementation } from 'threads/dist/types/master';
import { Buffer } from 'buffer';
import { LazyLoader } from '../interfaces.js';

export class InlinedWorkerLoader extends LazyLoader<WorkerImplementation> {
    constructor(b64script: string) {
        super(() => {
            const script = fromBase64(b64script);
            return BlobWorker.fromText(script);
        });
    }
}

export class InlinedWasmLoader extends LazyLoader<Buffer> {
    constructor(b64wasm: string) {
        super(() => {
            const wasm = toUint8Array(b64wasm);
            return Buffer.from(wasm);
        });
    }
}
