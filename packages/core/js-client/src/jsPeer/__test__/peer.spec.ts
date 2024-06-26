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

import { it, describe, expect } from "vitest";

import { handleTimeout } from "../../particle/Particle.js";
import { registerHandlersHelper, withPeer } from "../../util/testUtils.js";
import { FluencePeer } from "../FluencePeer.js";

describe("FluencePeer usage test suite", () => {
  it("Should successfully call identity on local peer", async function () {
    await withPeer(async (peer) => {
      const script = `
            (seq
                (call %init_peer_id% ("op" "identity") ["test"] res)
                (call %init_peer_id% ("callback" "callback") [res])
            )
            `;

      const particle = await peer.internals.createNewParticle(script);

      const res = await new Promise((resolve, reject) => {
        if (particle instanceof Error) {
          reject(particle.message);
          return;
        }

        registerHandlersHelper(peer, particle, {
          callback: {
            callback: (args): undefined => {
              const [res] = args;
              resolve(res);
            },
          },
        });

        peer.internals.initiateParticle(
          particle,
          () => {},
          handleTimeout(reject),
        );
      });

      expect(res).toBe("test");
    });
  });

  it("Should throw correct message when calling non existing local service", async function () {
    await withPeer(async (peer) => {
      const res = callIncorrectService(peer);

      await expect(res).rejects.toMatchObject({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        message: expect.stringContaining(
          `"No service found for service call: serviceId='incorrect', fnName='incorrect' args='[]'"`,
        ),
        instruction: 'call %init_peer_id% ("incorrect" "incorrect") [] res',
      });
    });
  });

  it("Should not crash if undefined is passed as a variable", async () => {
    await withPeer(async (peer) => {
      const script = `
        (seq
            (call %init_peer_id% ("load" "arg") [] arg)
            (seq
                (call %init_peer_id% ("op" "identity") [arg] res)
                (call %init_peer_id% ("callback" "callback") [res])
            )
        )`;

      const particle = await peer.internals.createNewParticle(script);

      const res = await new Promise((resolve, reject) => {
        if (particle instanceof Error) {
          reject(particle.message);
          return;
        }

        registerHandlersHelper(peer, particle, {
          load: {
            arg: () => {
              return undefined;
            },
          },
          callback: {
            callback: (args): undefined => {
              const [val] = args;
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

      expect(res).toBe(null);
    });
  });

  it("Should not crash if an error ocurred in user-defined handler", async () => {
    await withPeer(async (peer) => {
      const script = `
        (xor
            (call %init_peer_id% ("load" "arg") [] arg)
            (call %init_peer_id% ("callback" "error") [%last_error%])
        )`;

      const particle = await peer.internals.createNewParticle(script);

      const promise = new Promise<never>((_resolve, reject) => {
        if (particle instanceof Error) {
          reject(particle.message);
          return;
        }

        registerHandlersHelper(peer, particle, {
          load: {
            arg: () => {
              throw new Error("my super custom error message");
            },
          },
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
          handleTimeout(reject),
        );
      });

      await expect(promise).rejects.toMatchObject({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        message: expect.stringContaining("my super custom error message"),
      });
    });
  });
});

async function callIncorrectService(peer: FluencePeer) {
  const script = `
    (xor
        (call %init_peer_id% ("incorrect" "incorrect") [] res)
        (call %init_peer_id% ("callback" "error") [%last_error%])
    )`;

  const particle = await peer.internals.createNewParticle(script);

  return new Promise<unknown[]>((resolve, reject) => {
    if (particle instanceof Error) {
      reject(particle.message);
      return;
    }

    registerHandlersHelper(peer, particle, {
      callback: {
        callback: (args): undefined => {
          resolve(args);
        },
        error: (args): undefined => {
          const [error] = args;
          reject(error);
        },
      },
    });

    peer.internals.initiateParticle(particle, () => {}, handleTimeout(reject));
  });
}
