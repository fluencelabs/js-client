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

import { toUint8Array } from "js-base64";
import { describe, expect, it, test, assert } from "vitest";

import { CallServiceData } from "../../jsServiceHost/interfaces.js";
import { KeyPair } from "../../keypair/index.js";
import { makeTestTetraplet } from "../../util/testUtils.js";
import type { JSONArray } from "../../util/types.js";
import { builtInServices } from "../builtins.js";
import { allowServiceFn } from "../securityGuard.js";
import { defaultSigGuard, Sig } from "../Sig.js";

const a10b20 = `{
    "a": 10,
    "b": 20
}`;

const oneTwoThreeFour = `[
    1,
    2,
    3,
    4
]`;

interface ServiceCallType {
  serviceId: string;
  fnName: string;
  args: JSONArray;
  retCode: 0 | 1;
  result: unknown;
}

describe("Tests for default handler", () => {
  test.each`
    serviceId  | fnName               | args                                       | retCode | result
    ${"op"}    | ${"identity"}        | ${[]}                                      | ${0}    | ${{}}
    ${"op"}    | ${"identity"}        | ${[1]}                                     | ${0}    | ${1}
    ${"op"}    | ${"identity"}        | ${[1, 2]}                                  | ${1}    | ${"Expected 1 argument(s). Got 2"}
    ${"op"}    | ${"noop"}            | ${[1, 2]}                                  | ${0}    | ${{}}
    ${"op"}    | ${"array"}           | ${[1, 2, 3]}                               | ${0}    | ${[1, 2, 3]}
    ${"op"}    | ${"array_length"}    | ${[[1, 2, 3]]}                             | ${0}    | ${3}
    ${"op"}    | ${"array_length"}    | ${[]}                                      | ${1}    | ${"Expected 1 argument(s). Got 0"}
    ${"op"}    | ${"concat"}          | ${[[1, 2], [3, 4], [5, 6]]}                | ${0}    | ${[1, 2, 3, 4, 5, 6]}
    ${"op"}    | ${"concat"}          | ${[[1, 2]]}                                | ${0}    | ${[1, 2]}
    ${"op"}    | ${"concat"}          | ${[]}                                      | ${0}    | ${[]}
    ${"op"}    | ${"concat"}          | ${[1, [1, 2], 1]}                          | ${1}    | ${"Argument 0 expected to be of type array, Got number"}
    ${"op"}    | ${"string_to_b58"}   | ${["test"]}                                | ${0}    | ${"3yZe7d"}
    ${"op"}    | ${"string_to_b58"}   | ${["test", 1]}                             | ${1}    | ${"Expected 1 argument(s). Got 2"}
    ${"op"}    | ${"string_from_b58"} | ${["3yZe7d"]}                              | ${0}    | ${"test"}
    ${"op"}    | ${"string_from_b58"} | ${["3yZe7d", 1]}                           | ${1}    | ${"Expected 1 argument(s). Got 2"}
    ${"op"}    | ${"bytes_to_b58"}    | ${[[116, 101, 115, 116]]}                  | ${0}    | ${"3yZe7d"}
    ${"op"}    | ${"bytes_to_b58"}    | ${[[116, 101, 115, 116], 1]}               | ${1}    | ${"Expected 1 argument(s). Got 2"}
    ${"op"}    | ${"bytes_from_b58"}  | ${["3yZe7d"]}                              | ${0}    | ${[116, 101, 115, 116]}
    ${"op"}    | ${"bytes_from_b58"}  | ${["3yZe7d", 1]}                           | ${1}    | ${"Expected 1 argument(s). Got 2"}
    ${"op"}    | ${"sha256_string"}   | ${["hello, world!"]}                       | ${0}    | ${"QmVQ8pg6L1tpoWYeq6dpoWqnzZoSLCh7E96fCFXKvfKD3u"}
    ${"op"}    | ${"sha256_string"}   | ${["hello, world!", true]}                 | ${1}    | ${"Expected 1 argument(s). Got 2"}
    ${"op"}    | ${"sha256_string"}   | ${[]}                                      | ${1}    | ${"Expected 1 argument(s). Got 0"}
    ${"op"}    | ${"concat_strings"}  | ${[]}                                      | ${0}    | ${""}
    ${"op"}    | ${"concat_strings"}  | ${["a", "b", "c"]}                         | ${0}    | ${"abc"}
    ${"peer"}  | ${"timeout"}         | ${[200, []]}                               | ${1}    | ${"Argument 1 expected to be of type string, Got array"}
    ${"peer"}  | ${"timeout"}         | ${[200, "test"]}                           | ${0}    | ${"test"}
    ${"peer"}  | ${"timeout"}         | ${[]}                                      | ${1}    | ${"Expected 2 argument(s). Got 0"}
    ${"peer"}  | ${"timeout"}         | ${[200, "test", 1]}                        | ${1}    | ${"Expected 2 argument(s). Got 3"}
    ${"debug"} | ${"stringify"}       | ${[]}                                      | ${0}    | ${'"<empty argument list>"'}
    ${"debug"} | ${"stringify"}       | ${[{ a: 10, b: 20 }]}                      | ${0}    | ${a10b20}
    ${"debug"} | ${"stringify"}       | ${[1, 2, 3, 4]}                            | ${0}    | ${oneTwoThreeFour}
    ${"math"}  | ${"add"}             | ${[2, 2]}                                  | ${0}    | ${4}
    ${"math"}  | ${"add"}             | ${[2]}                                     | ${1}    | ${"Expected 2 argument(s). Got 1"}
    ${"math"}  | ${"sub"}             | ${[2, 2]}                                  | ${0}    | ${0}
    ${"math"}  | ${"sub"}             | ${[2, 3]}                                  | ${0}    | ${-1}
    ${"math"}  | ${"mul"}             | ${[2, 2]}                                  | ${0}    | ${4}
    ${"math"}  | ${"mul"}             | ${[2, 0]}                                  | ${0}    | ${0}
    ${"math"}  | ${"mul"}             | ${[2, -1]}                                 | ${0}    | ${-2}
    ${"math"}  | ${"fmul"}            | ${[10, 0.66]}                              | ${0}    | ${6}
    ${"math"}  | ${"fmul"}            | ${[0.5, 0.5]}                              | ${0}    | ${0}
    ${"math"}  | ${"fmul"}            | ${[100.5, 0.5]}                            | ${0}    | ${50}
    ${"math"}  | ${"div"}             | ${[2, 2]}                                  | ${0}    | ${1}
    ${"math"}  | ${"div"}             | ${[2, 3]}                                  | ${0}    | ${0}
    ${"math"}  | ${"div"}             | ${[10, 5]}                                 | ${0}    | ${2}
    ${"math"}  | ${"rem"}             | ${[10, 3]}                                 | ${0}    | ${1}
    ${"math"}  | ${"pow"}             | ${[2, 2]}                                  | ${0}    | ${4}
    ${"math"}  | ${"pow"}             | ${[2, 0]}                                  | ${0}    | ${1}
    ${"math"}  | ${"log"}             | ${[2, 2]}                                  | ${0}    | ${1}
    ${"math"}  | ${"log"}             | ${[2, 4]}                                  | ${0}    | ${2}
    ${"cmp"}   | ${"gt"}              | ${[2, 4]}                                  | ${0}    | ${false}
    ${"cmp"}   | ${"gte"}             | ${[2, 4]}                                  | ${0}    | ${false}
    ${"cmp"}   | ${"gte"}             | ${[4, 2]}                                  | ${0}    | ${true}
    ${"cmp"}   | ${"gte"}             | ${[2, 2]}                                  | ${0}    | ${true}
    ${"cmp"}   | ${"lt"}              | ${[2, 4]}                                  | ${0}    | ${true}
    ${"cmp"}   | ${"lte"}             | ${[2, 4]}                                  | ${0}    | ${true}
    ${"cmp"}   | ${"lte"}             | ${[4, 2]}                                  | ${0}    | ${false}
    ${"cmp"}   | ${"lte"}             | ${[2, 2]}                                  | ${0}    | ${true}
    ${"cmp"}   | ${"cmp"}             | ${[2, 4]}                                  | ${0}    | ${-1}
    ${"cmp"}   | ${"cmp"}             | ${[2, -4]}                                 | ${0}    | ${1}
    ${"cmp"}   | ${"cmp"}             | ${[2, 2]}                                  | ${0}    | ${0}
    ${"array"} | ${"sum"}             | ${[[1, 2, 3]]}                             | ${0}    | ${6}
    ${"array"} | ${"dedup"}           | ${[["a", "a", "b", "c", "a", "b", "c"]]}   | ${0}    | ${["a", "b", "c"]}
    ${"array"} | ${"intersect"}       | ${[["a", "b", "c"], ["c", "b", "d"]]}      | ${0}    | ${["b", "c"]}
    ${"array"} | ${"diff"}            | ${[["a", "b", "c"], ["c", "b", "d"]]}      | ${0}    | ${["a"]}
    ${"array"} | ${"sdiff"}           | ${[["a", "b", "c"], ["c", "b", "d"]]}      | ${0}    | ${["a", "d"]}
    ${"json"}  | ${"obj"}             | ${["a", 10, "b", "string", "c", null]}     | ${0}    | ${{ a: 10, b: "string", c: null }}
    ${"json"}  | ${"obj"}             | ${["a", 10, "b", "string", "c"]}           | ${1}    | ${"Expected even number of argument(s). Got 5"}
    ${"json"}  | ${"obj"}             | ${[]}                                      | ${0}    | ${{}}
    ${"json"}  | ${"put"}             | ${[{}, "a", 10]}                           | ${0}    | ${{ a: 10 }}
    ${"json"}  | ${"put"}             | ${[{ b: 11 }, "a", 10]}                    | ${0}    | ${{ a: 10, b: 11 }}
    ${"json"}  | ${"put"}             | ${["a", "a", 11]}                          | ${1}    | ${"Argument 0 expected to be of type object, Got string"}
    ${"json"}  | ${"put"}             | ${[{}, "a", 10, "b", 20]}                  | ${1}    | ${"Expected 3 argument(s). Got 5"}
    ${"json"}  | ${"put"}             | ${[{}]}                                    | ${1}    | ${"Expected 3 argument(s). Got 1"}
    ${"json"}  | ${"puts"}            | ${[{}, "a", 10]}                           | ${0}    | ${{ a: 10 }}
    ${"json"}  | ${"puts"}            | ${[{ b: 11 }, "a", 10]}                    | ${0}    | ${{ a: 10, b: 11 }}
    ${"json"}  | ${"puts"}            | ${[{}, "a", 10, "b", "string", "c", null]} | ${0}    | ${{ a: 10, b: "string", c: null }}
    ${"json"}  | ${"puts"}            | ${[{ x: "text" }, "a", 10, "b", "string"]} | ${0}    | ${{ a: 10, b: "string", x: "text" }}
    ${"json"}  | ${"puts"}            | ${[{}]}                                    | ${1}    | ${"Expected more than 3 argument(s). Got 1"}
    ${"json"}  | ${"puts"}            | ${["a", "a", 11]}                          | ${1}    | ${"Argument 0 expected to be of type object, Got string"}
    ${"json"}  | ${"stringify"}       | ${[{ a: 10, b: "string", c: null }]}       | ${0}    | ${'{"a":10,"b":"string","c":null}'}
    ${"json"}  | ${"stringify"}       | ${[1]}                                     | ${1}    | ${"Argument 0 expected to be of type object, Got number"}
    ${"json"}  | ${"parse"}           | ${['{"a":10,"b":"string","c":null}']}      | ${0}    | ${{ a: 10, b: "string", c: null }}
    ${"json"}  | ${"parse"}           | ${["incorrect"]}                           | ${1}    | ${"Unexpected token i in JSON at position 0"}
    ${"json"}  | ${"parse"}           | ${[10]}                                    | ${1}    | ${"Argument 0 expected to be of type string, Got number"}
  `(
    //
    "$fnName with $args expected retcode: $retCode and result: $result",
    async ({ serviceId, fnName, args, retCode, result }: ServiceCallType) => {
      // arrange
      const req: CallServiceData = {
        serviceId: serviceId,
        fnName: fnName,
        args: args,
        tetraplets: [],
        particleContext: {
          particleId: "some",
          initPeerId: "init peer id",
          timestamp: 595951200,
          ttl: 595961200,
          signature: new Uint8Array([]),
          tetraplets: [],
        },
      };

      // act
      const fn = builtInServices[req.serviceId]?.[req.fnName];
      assert(fn);
      const res = await fn(req);

      // Our test cases above depend on node error message. In node 20 error message for JSON.parse has changed.
      // Simple and fast solution for this specific case is to unify both variations into node 18 version error format.
      if (
        res.result === "Unexpected token 'i', \"incorrect\" is not valid JSON"
      ) {
        res.result = "Unexpected token i in JSON at position 0";
      }

      // assert
      expect(res).toMatchObject({
        retCode: retCode,
        result: result,
      });
    },
  );

  it("should return correct error message for identiy service", async () => {
    // arrange
    const req: CallServiceData = {
      serviceId: "peer",
      fnName: "identify",
      args: [],
      tetraplets: [],
      particleContext: {
        particleId: "some",
        initPeerId: "init peer id",
        timestamp: 595951200,
        ttl: 595961200,
        signature: new Uint8Array([]),
        tetraplets: [],
      },
    };

    // act
    const fn = builtInServices[req.serviceId]?.[req.fnName];
    assert(fn);
    const res = await fn(req);

    // assert
    expect(res).toMatchObject({
      retCode: 0,
      result: {
        external_addresses: [],
        // stringContaining method returns any for some reason
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        node_version: expect.stringContaining("js"),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        air_version: expect.stringContaining("js"),
      },
    });
  });
});

const key = "+cmeYlZKj+MfSa9dpHV+BmLPm6wq4inGlsPlQ1GvtPk=";

const context = (async () => {
  const keyBytes = toUint8Array(key);
  const kp = await KeyPair.fromEd25519SK(keyBytes);

  const res = {
    peerKeyPair: kp,
    peerId: kp.getPeerId(),
  };

  return res;
})();

const testData = [1, 2, 3, 4, 5, 6, 7, 9, 10];

// signature produced by KeyPair created from key above (`key` variable)
const testDataSig = [
  224, 104, 245, 206, 140, 248, 27, 72, 68, 133, 111, 10, 164, 197, 242, 132,
  107, 77, 224, 67, 99, 106, 76, 29, 144, 121, 122, 169, 36, 173, 58, 80, 170,
  102, 137, 253, 157, 247, 168, 87, 162, 223, 188, 214, 203, 220, 52, 246, 29,
  86, 77, 71, 224, 248, 16, 213, 254, 75, 78, 239, 243, 222, 241, 15,
];

// signature produced by KeyPair created from some random KeyPair
const testDataWrongSig = [
  116, 247, 189, 118, 236, 53, 147, 123, 219, 75, 176, 105, 101, 108, 233, 137,
  97, 14, 146, 132, 252, 70, 51, 153, 237, 167, 156, 150, 36, 90, 229, 108, 166,
  231, 255, 137, 8, 246, 125, 0, 213, 150, 83, 196, 237, 221, 131, 159, 157,
  159, 25, 109, 95, 160, 181, 65, 254, 238, 47, 156, 240, 151, 58, 14,
];

describe("Sig service tests", () => {
  it("sig.sign should create the correct signature", async () => {
    const ctx = await context;
    const sig = new Sig(ctx.peerKeyPair);

    const res = await sig.sign({
      args: [testData],
      context: makeTestTetraplet(ctx.peerId, "any_service", "any_func"),
    });

    expect(res.success).toBe(true);
    expect(res.signature).toStrictEqual([testDataSig]);
  });

  it("sig.verify should return true for the correct signature", async () => {
    const ctx = await context;
    const sig = new Sig(ctx.peerKeyPair);

    const res = await sig.verify({
      args: [testDataSig, testData],
      context: makeTestTetraplet(ctx.peerId, "any_service", "any_func"),
    });

    expect(res).toBe(true);
  });

  it("sig.verify should return false for the incorrect signature", async () => {
    const ctx = await context;
    const sig = new Sig(ctx.peerKeyPair);

    const res = await sig.verify({
      args: [testDataWrongSig, testData],
      context: makeTestTetraplet(ctx.peerId, "any_service", "any_func"),
    });

    expect(res).toBe(false);
  });

  it("sign-verify call chain should work", async () => {
    const ctx = await context;
    const sig = new Sig(ctx.peerKeyPair);

    const signature = await sig.sign({
      args: [testData],
      context: makeTestTetraplet(ctx.peerId, "any_service", "any_func"),
    });

    expect(signature.success).toBe(true);
    assert(signature.success);

    const res = await sig.verify({
      args: [signature.signature[0], testData],
      context: makeTestTetraplet(ctx.peerId, "any_service", "any_func"),
    });

    expect(res).toBe(true);
  });

  it("sig.sign with defaultSigGuard should work for correct callParams", async () => {
    const ctx = await context;
    const sig = new Sig(ctx.peerKeyPair);
    sig.securityGuard = defaultSigGuard(ctx.peerId);

    const signature = await sig.sign({
      args: [testData],
      context: makeTestTetraplet(ctx.peerId, "registry", "get_route_bytes"),
    });

    expect(signature).toBeDefined();
  });

  it("sig.sign with defaultSigGuard should not allow particles initiated from incorrect service", async () => {
    const ctx = await context;
    const sig = new Sig(ctx.peerKeyPair);
    sig.securityGuard = defaultSigGuard(ctx.peerId);

    const res = await sig.sign({
      args: [testData],
      context: makeTestTetraplet(ctx.peerId, "other_service", "other_fn"),
    });

    expect(res.success).toBe(false);
    expect(res.error).toStrictEqual(["Security guard validation failed"]);
  });

  it("sig.sign with defaultSigGuard should not allow particles initiated from other peers", async () => {
    const ctx = await context;
    const sig = new Sig(ctx.peerKeyPair);
    sig.securityGuard = defaultSigGuard(ctx.peerId);

    const res = await sig.sign({
      args: [testData],
      context: makeTestTetraplet(
        (await KeyPair.randomEd25519()).getPeerId(),
        "registry",
        "get_key_bytes",
      ),
    });

    expect(res.success).toBe(false);
    expect(res.error).toStrictEqual(["Security guard validation failed"]);
  });

  it("changing securityGuard should work", async () => {
    const ctx = await context;
    const sig = new Sig(ctx.peerKeyPair);
    sig.securityGuard = allowServiceFn("test", "test");

    const successful1 = await sig.sign({
      args: [testData],
      context: makeTestTetraplet(ctx.peerId, "test", "test"),
    });

    const unSuccessful1 = await sig.sign({
      args: [testData],
      context: makeTestTetraplet(ctx.peerId, "wrong", "wrong"),
    });

    sig.securityGuard = allowServiceFn("wrong", "wrong");

    const successful2 = await sig.sign({
      args: [testData],
      context: makeTestTetraplet(ctx.peerId, "wrong", "wrong"),
    });

    const unSuccessful2 = await sig.sign({
      args: [testData],
      context: makeTestTetraplet(ctx.peerId, "test", "test"),
    });

    expect(successful1.success).toBe(true);
    expect(successful2.success).toBe(true);
    expect(unSuccessful1.success).toBe(false);
    expect(unSuccessful2.success).toBe(false);
  });
});
