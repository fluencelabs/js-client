import { createRequire } from 'module';

// @ts-ignore
import type { WorkerImplementation } from 'threads/dist/types/master';
// @ts-ignore
import { Worker } from 'threads';
import { Buffer } from 'buffer';
import * as fs from 'fs';
import * as path from 'path';
import { LazyLoader } from '../interfaces.js';

const require = createRequire(import.meta.url);

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
    return loadWasmFromFileSystem(filePath);
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

export class WasmLoaderFromFs extends LazyLoader<SharedArrayBuffer> {
    constructor(filePath: string) {
        super(() => loadWasmFromFileSystem(filePath));
    }
}

export class WasmLoaderFromNpm extends LazyLoader<SharedArrayBuffer> {
    constructor(pkg: string, file: string) {
        super(() => loadWasmFromNpmPackage({ package: pkg, file: file }));
    }
}

export class WorkerLoaderFromFs extends LazyLoader<WorkerImplementation> {
    constructor(scriptPath: string) {
        super(() => new Worker(scriptPath));
    }
}

export class WorkerLoaderFromNpm extends LazyLoader<WorkerImplementation> {
    constructor(pkg: string, file: string) {
        super(() => {
            const packagePath = require.resolve(pkg);
            const scriptPath = path.join(path.dirname(packagePath), file);
            return new Worker(scriptPath);
        });
    }
}
