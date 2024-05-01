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

import { fileURLToPath } from "url";

import { compileFromPath } from "@fluencelabs/aqua-api";
import { beforeAll, describe, expect, it } from "vitest";

import { getPackageJsonContent, PackageJson } from "../../utils.js";
import { generateTypes, generateSources } from "../index.js";
import { CompilationResult } from "../interfaces.js";

let res: Omit<CompilationResult, "funcCall">;
let pkg: PackageJson;

describe("Aqua to js/ts compiler", () => {
  beforeAll(async () => {
    res = await compileFromPath({
      filePath: fileURLToPath(
        new URL("./sources/smoke_test.aqua", import.meta.url),
      ),
      imports: ["./node_modules"],
      targetType: "air",
    });

    pkg = {
      ...(await getPackageJsonContent()),
      version: "0.0.0",
      devDependencies: {
        "@fluencelabs/aqua-api": "0.0.0",
      },
    };
  });

  it("matches js snapshots", async () => {
    const jsResult = generateSources(res, "js", pkg);
    const jsTypes = generateTypes(res, pkg);

    await expect(jsResult).toMatchFileSnapshot(
      "./__snapshots__/generate.snap.js",
    );

    await expect(jsTypes).toMatchFileSnapshot(
      "./__snapshots__/generate.snap.d.ts",
    );
  });

  it("matches ts snapshots", async () => {
    const tsResult = generateSources(res, "ts", pkg);

    await expect(tsResult).toMatchFileSnapshot(
      "./__snapshots__/generate.snap.ts",
    );
  });
});
