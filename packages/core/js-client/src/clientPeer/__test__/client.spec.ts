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
import { it, describe, expect } from "vitest";

import { CallServiceData } from "../../jsServiceHost/interfaces.js";
import { doNothing } from "../../jsServiceHost/serviceUtils.js";
import { handleTimeout } from "../../particle/Particle.js";
import { registerHandlersHelper, withClient } from "../../util/testUtils.js";
import { checkConnection } from "../checkConnection.js";

import { nodes, RELAY } from "./connection.js";

describe("FluenceClient usage test suite", () => {
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
                    return reject(particle.message);
                }

                registerHandlersHelper(peer, particle, {
                    load: {
                        relay: () => {
                            return peer.getRelayPeerId();
                        },
                    },
                    callback: {
                        callback: (args) => {
                            const [val] = args;
                            resolve(val);
                        },
                        error: (args) => {
                            const [error] = args;
                            reject(error);
                        },
                    },
                });

                peer.internals.initiateParticle(
                    particle,
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

                const particle =
                    await peer1.internals.createNewParticle(script);

                if (particle instanceof Error) {
                    throw particle;
                }

                peer1.internals.initiateParticle(particle, doNothing);

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

        it("With connection options: defaultTTL", async () => {
            await withClient(RELAY, { defaultTtlMs: 1 }, async (peer) => {
                const isConnected = await checkConnection(peer);

                expect(isConnected).toBeFalsy();
            });
        });
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
                    return reject(particle.message);
                }

                registerHandlersHelper(peer, particle, {
                    callback: {
                        error: (args) => {
                            const [error] = args;
                            reject(error);
                        },
                    },
                });

                peer.internals.initiateParticle(particle, (stage) => {
                    if (stage.stage === "sendingError") {
                        reject(stage.errorMessage);
                    }
                });
            });

            await promise;

            await expect(promise).rejects.toMatch(
                "Particle is expected to be sent to only the single peer (relay which client is connected to)",
            );
        });
    });
});
