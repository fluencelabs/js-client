import { BlobWorker } from 'threads';
import { fromBase64, toUint8Array } from 'js-base64';
import type { WorkerImplementation } from 'threads/dist/types/master';
import { LazyLoader } from '../../interfaces/index.js';
import { Buffer } from 'buffer';

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
            const buffer = Buffer.from(wasm);
            return Promise.resolve(buffer);
        });
    }
}
