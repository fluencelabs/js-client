import { BlobWorker, Worker } from 'threads';
import { Buffer } from 'buffer';
import { LazyLoader } from '@fluencelabs/interfaces';
import type { WorkerImplementation } from 'threads/dist/types/master';
import { fromBase64 } from 'js-base64';
// @ts-ignore
import b64script from './marine-js.b64.web';

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
export const loadWasmFromServer = async (filePath: string): Promise<SharedArrayBuffer | Buffer> => {
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

export class WasmWebLoader extends LazyLoader<SharedArrayBuffer | Buffer> {
    constructor(filePath: string) {
        super(() => loadWasmFromServer(filePath));
    }
}

export class InlinedWorkerLoader extends LazyLoader<WorkerImplementation> {
    constructor() {
        super(() => {
            const script = fromBase64(b64script);
            return Promise.resolve(BlobWorker.fromText(script));
        });
    }
}

export class WorkerLoader extends LazyLoader<WorkerImplementation> {
    constructor(path: string) {
        super(() => {
            return new Worker(path);
        });
    }
}
