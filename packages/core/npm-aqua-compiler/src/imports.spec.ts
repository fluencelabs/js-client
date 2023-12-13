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

import { describe, expect, it } from "vitest";

import { gatherImportsFromNpm } from "./imports.js";
import { join } from "path";
import { fileURLToPath } from "url";

describe("imports", () => {
  /**
   * NOTE: This test expects that `npm i` is run
   * inside `./__test__/data/transitive-deps/project` folder
   */
  it("should resolve transitive dependencies", async () => {
    const expectedResolution: Record<string, string[]> = {
      "": ["A", "B"],
      A: ["C", "D"],
      B: ["BC", "BD"],
      C: ["CD"],
      BC: ["BCD"],
    };

    const prefix = join(
      fileURLToPath(new URL("./", import.meta.url)),
      "..",
      "test",
      "transitive-deps",
      "project",
    );

    const buildResolutionKey = (str: string) =>
      str.slice(prefix.length).split("/node_modules/").filter(Boolean).join("");

    const imports = await gatherImportsFromNpm(
      "./test/transitive-deps/project",
    );

    expect(Object.keys(imports).length).toBe(
      Object.keys(expectedResolution).length,
    );

    for (const key in imports) {
      const resolutionKey = buildResolutionKey(key);

      expect(imports[key].length).toBe(
        expectedResolution[resolutionKey].length,
      );

      for (const location of imports[key]) {
        expect(expectedResolution[resolutionKey]).toContain(
          buildResolutionKey(location),
        );
      }
    }
  });
});
