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

import { access, symlink } from "fs/promises";
import { createServer } from "http";
import type { Server } from "http";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import handler from "serve-handler";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const CDN_PUBLIC_PATH = join(
  __dirname,
  "../../../core/js-client/dist/browser",
);

export const JS_CLIENT_DEPS_PATH = join(
  __dirname,
  "../../../core/js-client/node_modules",
);

export const startCdn = (port: number) => {
  return startContentServer(port, CDN_PUBLIC_PATH);
};

export const createSymlinkIfNotExists = async (
  target: string,
  path: string,
) => {
  try {
    await access(path);
  } catch {
    await symlink(target, path);
  }
};

export const startContentServer = (
  port: number,
  publicDir: string,
): Promise<Server> => {
  const server = createServer((request, response) => {
    void handler(request, response, {
      public: publicDir,
      rewrites: [
        {
          source: "/js-client.min.js",
          destination: "/source/index.min.js",
        },
        {
          source: "/@fluencelabs/:name([\\w-]+)@:version([\\w-.]+)/dist/:asset",
          destination:
            "/node_modules/@fluencelabs/js-client-isomorphic/node_modules/@fluencelabs/:name/dist/:asset",
        },
        {
          source:
            "/@fluencelabs/:name([\\w-]+)@:version([\\w-.]+)/dist/:prefix/:asset",
          destination:
            "/node_modules/@fluencelabs/js-client-isomorphic/node_modules/@fluencelabs/:name/dist/:prefix/:asset",
        },
      ],
      headers: [
        {
          source: "**/*",
          headers: [
            {
              key: "Cross-Origin-Opener-Policy",
              value: "same-origin",
            },
            {
              key: "Cross-Origin-Embedder-Policy",
              value: "require-corp",
            },
          ],
        },
      ],
    });
  });

  return new Promise<Server>((resolve) => {
    const result = server.listen(port, () => {
      console.log(`server started on port ${port}`);
      console.log(`public dir ${publicDir}`);
      resolve(result);
    });
  });
};

export const stopServer = (app: Server): Promise<void> => {
  return new Promise<void>((resolve) => {
    app.close(() => {
      console.log("server stopped");
      resolve();
    });
  });
};
