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

import { FetchResourceFn, getVersionedPackage } from "../types.js";

/**
 * @param pkg name of package with version
 * @param assetPath path of required asset in given package
 * @param root CDN domain in browser or file system root in node
 */
export const fetchResource: FetchResourceFn = async (pkg, assetPath, root) => {
  const refinedAssetPath = assetPath.startsWith("/")
    ? assetPath.slice(1)
    : assetPath;

  const { name, version } = getVersionedPackage(pkg);
  const url = new URL(`${name}@${version}/` + refinedAssetPath, root);

  return fetch(url).catch(() => {
    throw new Error(`Cannot fetch from ${url.toString()}`);
  });
};
