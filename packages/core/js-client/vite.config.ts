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

import { createRequire } from "module";

import inject from "@rollup/plugin-inject";
import { transform } from "esbuild";
import { PluginOption, UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const require = createRequire(import.meta.url);
const esbuildShim = require.resolve("node-stdlib-browser/helpers/esbuild/shim");

function minifyEs(): PluginOption {
  return {
    name: "minifyEs",
    renderChunk: {
      order: "post",
      async handler(code, chunk, outputOptions) {
        if (
          outputOptions.format === "es" &&
          chunk.fileName.endsWith(".min.js")
        ) {
          return await transform(code, { minify: true });
        }

        return code;
      },
    },
  };
}

const config: UserConfig = {
  build: {
    target: "modules",
    minify: "esbuild",
    lib: {
      entry: "./src/index.ts",
      name: "js-client",
      fileName: () => {
        return "index.min.js";
      },
      formats: ["es"],
    },
    outDir: "./dist/browser",
    rollupOptions: {
      plugins: [
        {
          // @ts-expect-error Types doesn't work here. Hack
          ...inject({
            global: [esbuildShim, "global"],
            process: [esbuildShim, "process"],
            Buffer: [esbuildShim, "Buffer"],
          }),
          enforce: "post",
        },
      ],
    },
  },
  plugins: [tsconfigPaths(), minifyEs()],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
};

export default config;
