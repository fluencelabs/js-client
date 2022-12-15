import { LazyLoader } from '@fluencelabs/interfaces';
import { BlobWorker } from 'threads';
import type { WorkerImplementation } from 'threads/dist/types/master';
import { Buffer } from 'buffer';
import fs from 'fs';
import path from 'path';
import { fromBase64 } from 'js-base64';
import b64script from './script';

const bufferToSharedArrayBuffer = (buffer: Buffer): SharedArrayBuffer => {
    const sab = new SharedArrayBuffer(buffer.length);
    const tmp = new Uint8Array(sab);
    tmp.set(buffer, 0);
    return sab;
};

/**
 * Load wasm file from npm package. Only works in nodejs environment.
 * The function returns SharedArrayBuffer compatible with FluenceAppService methods.
 * @param source - object specifying the source of the file. Consist two fields: package name and file path.
 * @returns SharedArrayBuffer with the wasm file
 */
export const loadWasmFromNpmPackage = async (source: { package: string; file: string }): Promise<SharedArrayBuffer> => {
    const packagePath = require.resolve(source.package);
    const filePath = path.join(path.dirname(packagePath), source.file);
    const buffer = await fs.promises.readFile(filePath);
    return bufferToSharedArrayBuffer(buffer);
};

/**
 * Load wasm file from the file system. Only works in nodejs environment.
 * The functions returns SharedArrayBuffer compatible with FluenceAppService methods.
 * @param filePath - path to the wasm file
 * @returns SharedArrayBuffer with the wasm fileWorker
 */
export const loadWasmFromFileSystem = async (filePath: string): Promise<SharedArrayBuffer> => {
    const buffer = await fs.promises.readFile(filePath);
    return bufferToSharedArrayBuffer(buffer);
};

export class WasmFsLoader extends LazyLoader<SharedArrayBuffer> {
    constructor(filePath: string) {
        super(() => loadWasmFromFileSystem(filePath));
    }
}

export class WasmNpmLoader extends LazyLoader<SharedArrayBuffer> {
    constructor(pkg: string, file: string) {
        super(() => loadWasmFromNpmPackage({ package: pkg, file: file }));
    }
}

export class FsWorkerLoader extends LazyLoader<WorkerImplementation> {
    constructor(scriptPath: string) {
        super(() => {
            return Promise.resolve(new Worker(scriptPath));
        });
    }
}

export class NpmWorkerLoader extends LazyLoader<WorkerImplementation> {
    constructor(pkg: string, file: string) {
        super(() => {
            const packagePath = require.resolve(pkg);
            const scriptPath = path.join(path.dirname(packagePath), file);
            return new Worker(scriptPath);
        });
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
