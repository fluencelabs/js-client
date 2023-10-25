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

import url from "url";

import { compileFromPath } from "@fluencelabs/aqua-api";
import { describe, expect, it } from "vitest";

import { getPackageJsonContent, PackageJson } from "../../utils.js";
import { generateTypes, generateSources } from "../index.js";

describe("Aqua to js/ts compiler", () => {
  it("compiles smoke tests successfully", async () => {
    const res = await compileFromPath({
      filePath: url.fileURLToPath(
        new URL("./sources/smoke_test.aqua", import.meta.url),
      ),
      imports: ["./node_modules"],
      targetType: "air",
    });

    const pkg: PackageJson = {
      ...(await getPackageJsonContent()),
      version: "0.0.0",
      devDependencies: {
        "@fluencelabs/aqua-api": "0.0.0",
      },
    };

    // TODO: see https://github.com/fluencelabs/js-client/pull/366#discussion_r1370567711
    // @ts-expect-error don't use compileFromPath directly here
    const jsResult = generateSources(res, "js", pkg);
    // TODO: see https://github.com/fluencelabs/js-client/pull/366#discussion_r1370567711
    // @ts-expect-error don't use compileFromPath directly here
    const jsTypes = generateTypes(res, pkg);

    expect(jsResult).toMatchSnapshot();
    expect(jsTypes).toMatchSnapshot();

    // TODO: see https://github.com/fluencelabs/js-client/pull/366#discussion_r1370567711
    // @ts-expect-error don't use compileFromPath directly here
    const tsResult = generateSources(res, "ts", pkg);

    expect(tsResult).toMatchSnapshot();
  });
});
