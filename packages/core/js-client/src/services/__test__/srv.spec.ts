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

import * as path from "path";
import * as url from "url";

import { it, describe, expect, beforeAll, assert } from "vitest";

import { compileAqua, CompiledFnCall, withPeer } from "../../util/testUtils.js";
import { registerNodeUtils } from "../_aqua/node-utils.js";
import { NodeUtils } from "../NodeUtils.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
let aqua: Record<string, CompiledFnCall>;

describe("Srv service test suite", () => {
  beforeAll(async () => {
    const pathToAquaFiles = path.join(__dirname, "../../../aqua_test/srv.aqua");

    const { functions } = await compileAqua(pathToAquaFiles);
    aqua = functions;
  });

  it("Use custom srv service, success path", async () => {
    await withPeer(async (peer) => {
      // arrange
      registerNodeUtils(peer, "node_utils", new NodeUtils(peer));

      const wasm = path.join(__dirname, "../../../data_for_test/greeting.wasm");

      // act
      assert(aqua["happy_path"]);
      const res = await aqua["happy_path"](peer, { file_path: wasm });

      // assert
      expect(res).toBe("Hi, test");
    });
  });

  it("List deployed services", async () => {
    await withPeer(async (peer) => {
      // arrange
      registerNodeUtils(peer, "node_utils", new NodeUtils(peer));

      const wasm = path.join(__dirname, "../../../data_for_test/greeting.wasm");

      // act
      assert(aqua["list_services"]);
      const res = await aqua["list_services"](peer, { file_path: wasm });

      // assert
      expect(res).toHaveLength(3);
    });
  });

  it("Correct error for removed services", async () => {
    await withPeer(async (peer) => {
      // arrange
      registerNodeUtils(peer, "node_utils", new NodeUtils(peer));

      const wasm = path.join(__dirname, "../../../data_for_test/greeting.wasm");

      // act
      assert(aqua["service_removed"]);

      const res = await aqua["service_removed"](peer, {
        file_path: wasm,
      });

      // assert
      expect(res).toMatch("No service found for service call");
    });
  });

  it("Correct error for file not found", async () => {
    await withPeer(async (peer) => {
      // arrange
      registerNodeUtils(peer, "node_utils", new NodeUtils(peer));

      // act
      assert(aqua["file_not_found"]);
      const res = await aqua["file_not_found"](peer, {});

      // assert
      expect(res).toMatch(
        "ENOENT: no such file or directory, open '/random/incorrect/file'",
      );
    });
  });

  it("Correct error for removing non existing service", async () => {
    await withPeer(async (peer) => {
      // arrange
      registerNodeUtils(peer, "node_utils", new NodeUtils(peer));

      // act
      assert(aqua["removing_non_exiting"]);
      const res = await aqua["removing_non_exiting"](peer, {});

      // assert
      expect(res).toMatch("Service with id random_id not found");
    });
  });
});
