/**
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

import { Buffer } from "buffer";
import fs from "fs";
import { createRequire } from "module";
import path from "path";

import {
  Worker,
  type Worker as WorkerImplementation,
} from "@fluencelabs/threads/master";

import { LazyLoader } from "../interfaces.js";

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
export const loadWasmFromNpmPackage = async (source: {
  package: string;
  file: string;
}): Promise<SharedArrayBuffer> => {
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
export const loadWasmFromFileSystem = async (
  filePath: string,
): Promise<SharedArrayBuffer> => {
  const buffer = await fs.promises.readFile(filePath);
  return bufferToSharedArrayBuffer(buffer);
};

export class WasmLoaderFromFs extends LazyLoader<SharedArrayBuffer> {
  constructor(filePath: string) {
    super(() => {
      return loadWasmFromFileSystem(filePath);
    });
  }
}

export class WasmLoaderFromNpm extends LazyLoader<SharedArrayBuffer> {
  constructor(pkg: string, file: string) {
    super(() => {
      return loadWasmFromNpmPackage({ package: pkg, file: file });
    });
  }
}

export class WorkerLoaderFromFs extends LazyLoader<WorkerImplementation> {
  constructor(scriptPath: string) {
    super(() => {
      return new Worker(scriptPath);
    });
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
