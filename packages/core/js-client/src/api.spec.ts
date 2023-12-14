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

import { fileURLToPath } from "url";

import { compileFromPath } from "@fluencelabs/aqua-api";
import { ServiceDef } from "@fluencelabs/interfaces";
import { assert, describe, expect, it } from "vitest";

import { v5_registerService } from "./api.js";
import { callAquaFunction } from "./compilerSupport/callFunction.js";
import { withPeer } from "./util/testUtils.js";

class CalcParent {
  protected _state: number = 0;

  add(n: number) {
    this._state += n;
  }

  subtract(n: number) {
    this._state -= n;
  }
}

class Calc extends CalcParent {
  multiply(n: number) {
    this._state *= n;
  }

  divide(n: number) {
    this._state /= n;
  }

  reset() {
    this._state = 0;
  }

  getResult() {
    return this._state;
  }
}

describe("User API methods", () => {
  it("registers user class service and calls own and inherited methods correctly", async () => {
    await withPeer(async (peer) => {
      const calcService: Record<never, unknown> = new Calc();

      const { functions, services } = await compileFromPath({
        filePath: fileURLToPath(new URL("../aqua/calc.aqua", import.meta.url)),
      });

      const typedServices: Record<string, ServiceDef> = services;

      assert("demoCalc" in functions);

      const { script } = functions["demoCalc"];

      assert("Calc" in typedServices);

      v5_registerService([peer, "calc", calcService], {
        defaultServiceId: "calc",
        functions: typedServices["Calc"].functions,
      });

      const res = await callAquaFunction({
        args: {},
        peer,
        script,
      });

      expect(res).toBe(7);
    });
  });
});
