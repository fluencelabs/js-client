/**
 * Copyright 2024 Fluence DAO
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

import type { MarineBackgroundInterface } from "@fluencelabs/marine-worker";
import { ModuleThread } from "@fluencelabs/threads/master";

import versions from "./versions.js";

export type FetchedPackages = keyof typeof versions;
type VersionedPackage = { name: string; version: string };
export type GetWorkerFn = (
  pkg: FetchedPackages,
  CDNUrl: string,
) => Promise<ModuleThread<MarineBackgroundInterface>>;

export const getVersionedPackage = (pkg: FetchedPackages): VersionedPackage => {
  return {
    name: pkg,
    version: versions[pkg],
  };
};

export type FetchResourceFn = (
  pkg: FetchedPackages,
  assetPath: string,
  root: string,
) => Promise<Response>;
