/*
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

import pkg from "./package.json" assert { type: "json" };
import { writeFile } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";

Object.prototype.pick = function (names) {
  return names.reduce((acc, name) => {
    acc[name] = this[name];
    return acc;
  }, {});
};

const output = { ...pkg.dependencies, ...pkg.devDependencies }.pick([
  "@fluencelabs/avm",
  "@fluencelabs/marine-js",
  "@fluencelabs/marine-worker",
]);

await writeFile(
  join(fileURLToPath(import.meta.url), "../src/versions.ts"),
    `/* eslint-disable */
export default ${JSON.stringify(output, null, 2)} as const`,
);
