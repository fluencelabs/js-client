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

import { it, describe, expect, assert } from "vitest";

import { ExpirationError } from "../../jsPeer/errors.js";
import { CallServiceData } from "../../jsServiceHost/interfaces.js";
import { handleTimeout } from "../../particle/Particle.js";
import { registerHandlersHelper, withClient } from "../../util/testUtils.js";
import type { JSONValue } from "../../util/types.js";
import { checkConnection } from "../checkConnection.js";

import { nodes, RELAY } from "./connection.js";

const ONE_SECOND = 1000;

describe("FluenceClient usage test suite", () => {
  it("Should stop particle processing after TTL is reached", async () => {
    await withClient(RELAY, { defaultTtlMs: 600 }, async (peer) => {
      const script = `
    (seq
        (call %init_peer_id% ("load" "relay") [] init_relay)
        (call init_relay ("peer" "timeout") [60000 "Do you really want to wait for so long?"])
    )`;

      const particle = await peer.internals.createNewParticle(script);

      const start = Date.now();

      const promise = new Promise<JSONValue>((resolve, reject) => {
        registerHandlersHelper(peer, particle, {
          load: {
            relay: () => {
              return peer.getRelayPeerId();
            },
          },
          callbackSrv: {
            response: () => {
              resolve({});
              return "";
            },
          },
        });

        peer.internals.initiateParticle(particle, resolve, reject, false);
      });

      await expect(promise).rejects.toThrow(ExpirationError);

      expect(
        Date.now() - 500,
        "Particle processing didn't stop after TTL is reached",
      ).toBeGreaterThanOrEqual(start);
    });
  });

  it("should make a call through network", async () => {
    await withClient(RELAY, {}, async (peer) => {
      // arrange

      const script = `
    (xor
        (seq
            (call %init_peer_id% ("load" "relay") [] init_relay)
            (seq
                (call init_relay ("op" "identity") ["hello world!"] result)
                (call %init_peer_id% ("callback" "callback") [result])
            )
        )
        (seq
            (call init_relay ("op" "identity") [])
            (call %init_peer_id% ("callback" "error") [%last_error%])
        )
    )`;

      const particle = await peer.internals.createNewParticle(script);

      const result = await new Promise<JSONValue>((resolve, reject) => {
        if (particle instanceof Error) {
          reject(particle.message);
          return;
        }

        registerHandlersHelper(peer, particle, {
          load: {
            relay: () => {
              return peer.getRelayPeerId();
            },
          },
          callback: {
            callback: (args): undefined => {
              const [val] = args;
              assert(val);
              resolve(val);
            },
            error: (args): undefined => {
              const [error] = args;
              reject(error);
            },
          },
        });

        peer.internals.initiateParticle(
          particle,
          () => {},
          handleTimeout(reject),
        );
      });

      expect(result).toBe("hello world!");
    });
  });

  it("check connection should work", async function () {
    await withClient(RELAY, {}, async (peer) => {
      const isConnected = await checkConnection(peer);

      expect(isConnected).toEqual(true);
    });
  });

  it("check connection should work with ttl", async function () {
    await withClient(RELAY, {}, async (peer) => {
      const isConnected = await checkConnection(peer, 10000);

      expect(isConnected).toEqual(true);
    });
  });

  it("two clients should work inside the same time javascript process", async () => {
    await withClient(RELAY, {}, async (peer1) => {
      await withClient(RELAY, {}, async (peer2) => {
        const res = new Promise((resolve) => {
          peer2.internals.regHandler.common(
            "test",
            "test",
            (req: CallServiceData) => {
              resolve(req.args[0]);
              return {
                result: {},
                retCode: 0,
              };
            },
          );
        });

        const script = `
            (seq
                (call "${peer1.getRelayPeerId()}" ("op" "identity") [])
                (call "${peer2.getPeerId()}" ("test" "test") ["test"])
            )
        `;

        const particle = await peer1.internals.createNewParticle(script);

        if (particle instanceof Error) {
          throw particle;
        }

        peer1.internals.initiateParticle(
          particle,
          () => {},
          () => {},
        );

        expect(await res).toEqual("test");
      });
    });
  });

  describe("should make connection to network", () => {
    it("address as string", async () => {
      await withClient(nodes[0].multiaddr, {}, async (peer) => {
        const isConnected = await checkConnection(peer);

        expect(isConnected).toBeTruthy();
      });
    });

    it("address as node", async () => {
      await withClient(nodes[0], {}, async (peer) => {
        const isConnected = await checkConnection(peer);

        expect(isConnected).toBeTruthy();
      });
    });

    it("With connection options: dialTimeout", async () => {
      await withClient(
        RELAY,
        { connectionOptions: { dialTimeoutMs: 100000 } },
        async (peer) => {
          const isConnected = await checkConnection(peer);

          expect(isConnected).toBeTruthy();
        },
      );
    });

    it("With connection options: skipCheckConnection", async () => {
      await withClient(
        RELAY,
        { connectionOptions: { skipCheckConnection: true } },
        async (peer) => {
          const isConnected = await checkConnection(peer);

          expect(isConnected).toBeTruthy();
        },
      );
    });

    it(
      "With connection options: defaultTTL",
      async () => {
        await withClient(RELAY, { defaultTtlMs: 1 }, async (peer) => {
          const isConnected = await checkConnection(peer);

          expect(isConnected).toBeFalsy();
        });
      },
      ONE_SECOND,
    );
  });

  it.skip("Should throw correct error when the client tries to send a particle not to the relay", async () => {
    await withClient(RELAY, {}, async (peer) => {
      const script = `
    (xor
        (call "incorrect_peer_id" ("any" "service") [])
        (call %init_peer_id% ("callback" "error") [%last_error%])
    )`;

      const particle = await peer.internals.createNewParticle(script);

      const promise = new Promise((_resolve, reject) => {
        if (particle instanceof Error) {
          reject(particle.message);
          return;
        }

        registerHandlersHelper(peer, particle, {
          callback: {
            error: (args): undefined => {
              const [error] = args;
              reject(error);
            },
          },
        });

        peer.internals.initiateParticle(
          particle,
          () => {},
          (error: Error) => {
            reject(error);
          },
        );
      });

      await expect(promise).rejects.toMatch(
        "Particle is expected to be sent to only the single peer (relay which client is connected to)",
      );
    });
  });
});
