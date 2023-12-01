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

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_CONFIG, FluencePeer } from "../../jsPeer/FluencePeer.js";
import { ResultCodes } from "../../jsServiceHost/interfaces.js";
import { KeyPair } from "../../keypair/index.js";
import { parallelLoadStrategy } from "../../marine/load-strategies.js";
import { MarineBackgroundRunner } from "../../marine/worker/index.js";
import { EphemeralNetworkClient } from "../client.js";
import { defaultConfig, EphemeralNetwork } from "../network.js";

let en: EphemeralNetwork;
let client: FluencePeer;
const relay = defaultConfig.peers[0].peerId;

// TODO: race condition here. Needs to be fixed
describe.skip("Ephemeral networks tests", () => {
  beforeEach(async () => {
    en = new EphemeralNetwork(defaultConfig);
    await en.up();

    const kp = await KeyPair.randomEd25519();

    const marineDeps = await parallelLoadStrategy("/");
    const marine = new MarineBackgroundRunner(...marineDeps);

    client = new EphemeralNetworkClient(DEFAULT_CONFIG, kp, marine, en, relay);
    await client.start();
  });

  afterEach(async () => {
    await client.stop();
    await en.down();
  });

  it("smoke test", async function () {
    // arrange
    const peers = defaultConfig.peers.map((x) => {
      return x.peerId;
    });

    const script = `
        (seq
            (call "${relay}" ("op" "noop") [])
            (seq
                (call "${peers[1]}" ("op" "noop") [])
                (seq
                    (call "${peers[2]}" ("op" "noop") [])
                    (seq
                        (call "${peers[3]}" ("op" "noop") [])
                        (seq
                            (call "${peers[4]}" ("op" "noop") [])
                            (seq
                                (call "${peers[5]}" ("op" "noop") [])
                                (seq
                                    (call "${relay}" ("op" "noop") [])
                                    (call %init_peer_id% ("test" "test") [])
                                )
                            )
                        )
                    )
                )
            )
        )
        `;

    const particle = await client.internals.createNewParticle(script);

    const promise = new Promise<string>((resolve) => {
      client.internals.regHandler.forParticle(
        particle.id,
        "test",
        "test",
        () => {
          resolve("success");
          return {
            result: "test",
            retCode: ResultCodes.success,
          };
        },
      );
    });

    // act
    client.internals.initiateParticle(
      particle,
      () => {},
      () => {},
    );

    // assert
    await expect(promise).resolves.toBe("success");
  });
});
