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

import assert from "assert";
import module from "module";
import path from "path";
import url from "url";

import { Worker } from "threads/master";

export async function getWorker(pkg: string, CDNUrl: string): Promise<Worker> {
  assert(typeof CDNUrl === "string");
  const pkgWithoutVersion = pkg.split("@").slice(0, -1).join("@");
  const require = module.createRequire(import.meta.url);

  const pathToThisFile = path.dirname(url.fileURLToPath(import.meta.url));

  const pathToWorker = require.resolve(pkgWithoutVersion);

  const relativePathToWorker = path.relative(pathToThisFile, pathToWorker);

  return Promise.resolve(new Worker(relativePathToWorker));
}