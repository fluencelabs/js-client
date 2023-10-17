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

import fs from "fs";
import module from "module";
import path from "path";

export async function fetchResource(
  pkg: string,
  assetPath: string,
  root: string,
) {
  // `root` will be handled somehow in the future. For now, we use filesystem root where js-client is running;
  root = "/";
  const require = module.createRequire(import.meta.url);
  const packagePathIndex = require.resolve(pkg);

  // Ensure that windows path is converted to posix path. So we can find a package
  const posixPath = packagePathIndex.split(path.sep).join(path.posix.sep);

  const matches = new RegExp(`(.+${pkg})`).exec(posixPath);

  const packagePath = matches?.[0];

  if (packagePath == null) {
    throw new Error(`Cannot find dependency ${pkg} in path ${posixPath}`);
  }

  const pathToResource = path.join(root, packagePath, assetPath);

  const file = await new Promise<ArrayBuffer>((resolve, reject) => {
    // Cannot use 'fs/promises' with current vite config. This module is not polyfilled by default.
    fs.readFile(pathToResource, (err, data) => {
      if (err != null) {
        reject(err);
        return;
      }

      resolve(data);
    });
  });

  return new Response(file, {
    headers: {
      "Content-type": assetPath.endsWith(".wasm")
        ? "application/wasm"
        : assetPath.endsWith(".js")
        ? "application/javascript"
        : "application/text",
    },
  });
}
