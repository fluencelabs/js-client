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

import { join } from "path";
import { fileURLToPath } from "url";

import { assert, describe, expect, it } from "vitest";

import { gatherImportsFromNpm } from "./imports.js";

describe("imports", () => {
  /**
   * NOTE: This test expects that `npm i` is run
   * inside `./__test__/data/transitive-deps/project` folder
   */
  it("should resolve transitive dependencies", async () => {
    const npmProjectDirPath = "./test/transitive-deps/project";
    const aquaToCompileDirPath = "./test/transitive-deps/aqua-project";
    const globalImports = ["./.fluence/aqua"];

    const expectedResolution: Record<
      string,
      Record<string, string[] | string>
    > = {
      [aquaToCompileDirPath]: {
        "": globalImports,
        A: "./A",
        B: "./B",
      },
      "./A": {
        C: "./C",
        D: "./D",
      },
      "./B": {
        C: "./B/C",
        D: "./B/D",
      },
      "./C": {
        D: "./C/D",
      },
      "./B/C": {
        D: "./B/C/D",
      },
    };

    const prefix = join(
      fileURLToPath(new URL("./", import.meta.url)),
      "..",
      "test",
      "transitive-deps",
      "project",
    );

    const buildResolutionKey = (str: string) => {
      return (
        "./" +
        str
          .slice(prefix.length)
          .split("/node_modules/")
          .filter(Boolean)
          .join("/")
      );
    };

    const imports = await gatherImportsFromNpm({
      npmProjectDirPath,
      aquaToCompileDirPath,
      globalImports,
    });

    expect(Object.keys(imports).length).toBe(
      Object.keys(expectedResolution).length,
    );

    Object.entries(imports).forEach(([key, value]) => {
      const resolutionKey =
        key === aquaToCompileDirPath ? key : buildResolutionKey(key);

      const resolutionValues = expectedResolution[resolutionKey];

      assert(resolutionValues);

      expect(Object.keys(value).length).toBe(
        Object.keys(resolutionValues).length,
      );

      for (const [dep, path] of Object.entries(value)) {
        if (Array.isArray(path)) {
          continue;
        }

        expect(expectedResolution[resolutionKey]).toHaveProperty(
          dep,
          buildResolutionKey(path),
        );
      }
    });
  });
});
