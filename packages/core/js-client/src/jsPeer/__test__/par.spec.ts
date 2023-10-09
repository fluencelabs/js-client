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

import assert from "assert";

import { JSONValue } from "@fluencelabs/interfaces";
import { describe, expect, it } from "vitest";

import {
    CallServiceData,
    ResultCodes,
} from "../../jsServiceHost/interfaces.js";
import { handleTimeout } from "../../particle/Particle.js";
import { registerHandlersHelper, withPeer } from "../../util/testUtils.js";

describe("FluencePeer flow tests", () => {
    it("should execute par instruction in parallel", async function () {
        await withPeer(async (peer) => {
            const script = `
                (par
                    (seq
                        (call %init_peer_id% ("flow" "timeout") [1000 "test1"] res1)
                        (call %init_peer_id% ("callback" "callback1") [res1])
                    )
                    (seq
                        (call %init_peer_id% ("flow" "timeout") [1000 "test2"] res2)
                        (call %init_peer_id% ("callback" "callback2") [res2])
                    )
                )
                `;

            const particle = await peer.internals.createNewParticle(script);

            const res = await new Promise((resolve, reject) => {
                peer.internals.regHandler.forParticle(
                    particle.id,
                    "flow",
                    "timeout",
                    (req: CallServiceData) => {
                        const [timeout, message] = req.args;
                        assert(typeof timeout === "number");

                        return new Promise((resolve) => {
                            setTimeout(() => {
                                const res = {
                                    result: message,
                                    retCode: ResultCodes.success,
                                };

                                resolve(res);
                            }, timeout);
                        });
                    },
                );

                if (particle instanceof Error) {
                    reject(particle.message);
                    return;
                }

                const values: JSONValue[] = [];

                registerHandlersHelper(peer, particle, {
                    callback: {
                        callback1: (args) => {
                            const [val] = args;
                            values.push(val);

                            if (values.length === 2) {
                                resolve(values);
                            }
                        },
                        callback2: (args) => {
                            const [val] = args;
                            values.push(val);

                            if (values.length === 2) {
                                resolve(values);
                            }
                        },
                    },
                });

                peer.internals.initiateParticle(
                    particle,
                    handleTimeout(reject),
                );
            });

            expect(res).toEqual(expect.arrayContaining(["test1", "test1"]));
        });
    }, 1500);
});
