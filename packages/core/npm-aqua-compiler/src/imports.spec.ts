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

import { join, resolve } from "path";
import { fileURLToPath } from "url";

import { assert, describe, expect, it } from "vitest";

import { gatherImportsFromNpm, GatherImportsResult } from "./imports.js";

const prefix = join(
  fileURLToPath(new URL("./", import.meta.url)),
  "..",
  "test",
  "transitive-deps",
  "project",
);

function buildResolutionKey(str: string) {
  return str
    .slice(prefix.length)
    .split("/node_modules/")
    .filter(Boolean)
    .join("/");
}

function matchTree(
  expected: GatherImportsResult,
  actual: GatherImportsResult,
  aquaToCompileDirPath: string | undefined,
) {
  if (aquaToCompileDirPath !== undefined) {
    aquaToCompileDirPath = resolve(aquaToCompileDirPath);
  }

  expect(Object.keys(actual).length).toBe(Object.keys(expected).length);

  Object.entries(actual).forEach(([key, value]) => {
    const resolutionKey =
      key === aquaToCompileDirPath ? key : buildResolutionKey(key);

    const resolutionValues = expected[resolutionKey];

    assert(resolutionValues);

    expect(Object.keys(value).length).toBe(
      Object.keys(resolutionValues).length,
    );

    for (const [dep, path] of Object.entries(value)) {
      if (Array.isArray(path)) {
        expect(dep).toBe("");
        expect(expected[resolutionKey]).toHaveProperty(dep, path);

        continue;
      }

      expect(expected[resolutionKey]).toHaveProperty(
        dep,
        buildResolutionKey(path),
      );
    }
  });
}

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
      [resolve(aquaToCompileDirPath)]: {
        "": globalImports,
        A: "A",
        B: "B",
      },
      A: {
        C: "C",
        D: "D",
      },
      B: {
        C: "B/C",
        D: "B/D",
      },
      C: {
        D: "C/D",
      },
      "B/C": {
        D: "B/C/D",
      },
    };

    const imports = await gatherImportsFromNpm({
      npmProjectDirPath,
      aquaToCompileDirPath,
      globalImports,
    });

    matchTree(expectedResolution, imports, aquaToCompileDirPath);
  });

  it("should resolve transitive dependencies and return a subtree when 'aquaToCompileDirPath' inside project 'node_modules' folder", async () => {
    const npmProjectDirPath = "./test/transitive-deps/project";

    const aquaToCompileDirPath =
      "./test/transitive-deps/project/node_modules/A";

    const globalImports = ["./.fluence/aqua"];

    const expectedResolution: Record<
      string,
      Record<string, string[] | string>
    > = {
      [resolve(aquaToCompileDirPath)]: {
        "": globalImports,
        C: "C",
        D: "D",
      },
      C: {
        D: "C/D",
      },
    };

    const imports = await gatherImportsFromNpm({
      npmProjectDirPath,
      aquaToCompileDirPath,
      globalImports,
    });

    matchTree(expectedResolution, imports, aquaToCompileDirPath);
  });

  it("should resolve transitive dependencies when project is empty", async () => {
    const npmProjectDirPath = "./test/transitive-deps/empty-project";

    const aquaToCompileDirPath =
      "./test/transitive-deps/empty-project/node_modules/A";

    const globalImports = ["./.fluence/aqua"];

    const expectedResolution: Record<
      string,
      Record<string, string[] | string>
    > = {
      [resolve(aquaToCompileDirPath)]: {
        "": globalImports,
      },
    };

    const imports = await gatherImportsFromNpm({
      npmProjectDirPath,
      aquaToCompileDirPath,
      globalImports,
    });

    matchTree(expectedResolution, imports, aquaToCompileDirPath);
  });
});
