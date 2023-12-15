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

import { JSONValue } from "@fluencelabs/interfaces";
import { it, describe, expect, assert } from "vitest";

import { handleTimeout } from "../../particle/Particle.js";
import { registerHandlersHelper, withPeer } from "../../util/testUtils.js";

describe("Basic AVM functionality in Fluence Peer tests", () => {
  it("Simple call", async () => {
    await withPeer(async (peer) => {
      const script = `
                (call %init_peer_id% ("print" "print") ["1"])
            `;

      const particle = await peer.internals.createNewParticle(script);

      const res = await new Promise<JSONValue>((resolve, reject) => {
        if (particle instanceof Error) {
          reject(particle.message);
          return;
        }

        registerHandlersHelper(peer, particle, {
          print: {
            print: (args): undefined => {
              const [res] = args;
              assert(res);
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

      expect(res).toBe("1");
    });
  });

  it("Par call", async () => {
    await withPeer(async (peer) => {
      const script = `
                (seq
                    (par
                        (call %init_peer_id% ("print" "print") ["1"])
                        (null)
                    )
                    (call %init_peer_id% ("print" "print") ["2"])
                )
            `;

      const particle = await peer.internals.createNewParticle(script);

      const res = await new Promise<JSONValue[]>((resolve, reject) => {
        const res: JSONValue[] = [];

        if (particle instanceof Error) {
          reject(particle.message);
          return;
        }

        registerHandlersHelper(peer, particle, {
          print: {
            print: (args): undefined => {
              assert(args[0]);
              res.push(args[0]);

              if (res.length === 2) {
                resolve(res);
              }
            },
          },
        });

        peer.internals.initiateParticle(
          particle,
          () => {},
          handleTimeout(reject),
        );
      });

      expect(res).toStrictEqual(["1", "2"]);
    });
  });

  it("Timeout in par call: race", async () => {
    await withPeer(async (peer) => {
      const script = `
                (seq
                    (call %init_peer_id% ("op" "identity") ["slow_result"] arg) 
                    (seq
                        (par
                            (call %init_peer_id% ("peer" "timeout") [1000 arg] $result)
                            (call %init_peer_id% ("op" "identity") ["fast_result"] $result)
                        )
                        (seq
                            (canon %init_peer_id% $result #result)
                            (call %init_peer_id% ("return" "return") [#result.$[0]]) 
                        )
                    )
                )
            `;

      const particle = await peer.internals.createNewParticle(script);

      const res = await new Promise((resolve, reject) => {
        if (particle instanceof Error) {
          reject(particle.message);
          return;
        }

        registerHandlersHelper(peer, particle, {
          return: {
            return: (args): undefined => {
              resolve(args[0]);
            },
          },
        });

        peer.internals.initiateParticle(
          particle,
          () => {},
          handleTimeout(reject),
        );
      });

      expect(res).toBe("fast_result");
    });
  });

  it("Timeout in par call: wait", async () => {
    await withPeer(async (peer) => {
      const script = `
                (seq
                    (call %init_peer_id% ("op" "identity") ["timeout_msg"] arg) 
                    (seq
                        (seq
                            (par
                                (call %init_peer_id% ("peer" "timeout") [1000 arg] $ok_or_err)
                                (call "invalid_peer" ("op" "identity") ["never"] $ok_or_err) 
                            )
                            (xor
                                (seq
                                    (canon %init_peer_id% $ok_or_err #ok_or_err)
                                    (match #ok_or_err.$[0] "timeout_msg"
                                        (ap "failed_with_timeout" $result)
                                    )
                                )
                                (ap "impossible happened" $result)
                            )
                        )
                        (seq
                            (canon %init_peer_id% $result #result)
                            (call %init_peer_id% ("return" "return") [#result.$[0]]) 
                        )
                    )
                )
            `;

      const particle = await peer.internals.createNewParticle(script);

      const res = await new Promise((resolve, reject) => {
        if (particle instanceof Error) {
          reject(particle.message);
          return;
        }

        registerHandlersHelper(peer, particle, {
          return: {
            return: (args): undefined => {
              resolve(args[0]);
            },
          },
        });

        peer.internals.initiateParticle(
          particle,
          () => {},
          handleTimeout(reject),
        );
      });

      expect(res).toBe("failed_with_timeout");
    });
  });
});
