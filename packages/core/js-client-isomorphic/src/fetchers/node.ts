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

import { readFile } from "fs/promises";
import { createRequire } from "module";
import { sep, posix, join } from "path";

import { FetchResourceFn, getVersionedPackage } from "../types.js";

/**
 * @param pkg name of package with version
 * @param assetPath path of required asset in given package
 */
export const fetchResource: FetchResourceFn = async (pkg, assetPath) => {
  const { name } = getVersionedPackage(pkg);
  const require = createRequire(import.meta.url);
  const packagePathIndex = require.resolve(name);

  // Ensure that windows path is converted to posix path. So we can find a package
  const posixPath = packagePathIndex.split(sep).join(posix.sep);

  const matches = new RegExp(`(.+${name})`).exec(posixPath);

  const packagePath = matches?.[0];

  if (packagePath === undefined) {
    throw new Error(`Cannot find dependency ${name} in path ${posixPath}`);
  }

  const pathToResource = join(packagePath, assetPath);

  const file = await readFile(pathToResource);

  return new Response(file, {
    headers: {
      "Content-type": assetPath.endsWith(".wasm")
        ? "application/wasm"
        : assetPath.endsWith(".js")
        ? "application/javascript"
        : "application/text",
    },
  });
};
