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

import * as fs from "fs";
import * as path from "path";
import * as url from "url";

import { it, describe, expect, beforeAll, assert } from "vitest";

import { compileAqua, CompiledFnCall, withPeer } from "../../util/testUtils.js";

let aqua: Record<string, CompiledFnCall>;
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

describe("Marine js tests", () => {
  beforeAll(async () => {
    const pathToAquaFiles = path.join(
      __dirname,
      "../../../aqua_test/marine-js.aqua",
    );

    const { functions } = await compileAqua(pathToAquaFiles);
    aqua = functions;
  });

  it("should call marine service correctly", async () => {
    await withPeer(async (peer) => {
      // arrange
      const wasm = await fs.promises.readFile(
        path.join(__dirname, "../../../data_for_test/greeting.wasm"),
      );

      await peer.registerMarineService(wasm, "greeting");

      // act
      assert(aqua["call"]);
      const res = await aqua["call"](peer, { arg: "test" });

      // assert
      expect(res).toBe("Hi, Hi, Hi, test");
    });
  });
});
