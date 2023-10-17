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

import { PluginOption } from "vite";
import { dirname, resolve } from "path";
import { createRequire } from "module";
import inject from "@rollup/plugin-inject";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const esbuildShim = require.resolve("node-stdlib-browser/helpers/esbuild/shim");

export default {
  build: {
    lib: {
      entry: resolve(dirname(fileURLToPath(import.meta.url)), "src/index.ts"),
      name: "MarineWorker",
    },
    outDir: "dist/browser",
  },
  plugins: [
    {
      // @ts-ignore
      ...inject({
        global: [esbuildShim, "global"],
        process: [esbuildShim, "process"],
        Buffer: [esbuildShim, "Buffer"],
      }),
      enforce: "post",
    } as PluginOption,
  ],
};
