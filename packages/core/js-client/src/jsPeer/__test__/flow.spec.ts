/*
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
import { describe, expect, it } from 'vitest';
import { registerHandlersHelper, withPeer } from '../../util/testUtils.js';
import { handleTimeout } from '../../particle/Particle.js';
import { CallServiceData, ResultCodes } from '../../jsServiceHost/interfaces.js';

describe('FluencePeer flow tests', () => {
    // TODO: fix this test
    it.skip('should not process concurrently single service in the same function', async function () {
        await withPeer(async (peer) => {
            const res = await new Promise<any>((resolve, reject) => {
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

                const particle = peer.internals.createNewParticle(script);
                
                let hasInnerCall = false;
                
                peer.internals.regHandler.forParticle(particle.id, 'flow', 'timeout', (req: CallServiceData) => {
                    const [timeout, message] = req.args;
                    
                    if (hasInnerCall) {
                        return {
                            result: "Single service processed concurrently",
                            retCode: ResultCodes.error,
                        };
                    }
                    
                    hasInnerCall = true;
                    
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            const res = {
                                result: message,
                                retCode: ResultCodes.success,
                            };
                            hasInnerCall = false;
                            resolve(res);
                        }, timeout);
                    });
                });

                if (particle instanceof Error) {
                    return reject(particle.message);
                }
                
                const values: any[] = [];

                registerHandlersHelper(peer, particle, {
                    callback: {
                        callback1: (args: any) => {
                            const [val] = args;
                            values.push(val);
                            if (values.length === 2) {
                                resolve(values);
                            }
                        },
                        callback2: (args: any) => {
                            const [val] = args;
                            values.push(val);
                            if (values.length === 2) {
                                resolve(values);
                            }
                        },
                    },
                });

                peer.internals.initiateParticle(particle, handleTimeout(reject));
            });

            await expect(res).toEqual(expect.arrayContaining(["test1", "test1"]));
        });
    });
});