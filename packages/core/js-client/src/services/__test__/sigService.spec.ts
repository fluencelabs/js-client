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

import { it, describe, expect, beforeAll } from "vitest";

import { registerService } from "../../compilerSupport/registerService.js";
import { KeyPair } from "../../keypair/index.js";
import { compileAqua, withPeer } from "../../util/testUtils.js";
import { allowServiceFn } from "../securityGuard.js";
import { Sig } from "../Sig.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

let aqua: any;
let sigDef: any;
let dataProviderDef: any;

describe("Sig service test suite", () => {
    beforeAll(async () => {
        const pathToAquaFiles = path.join(
            __dirname,
            "../../../aqua_test/sigService.aqua",
        );

        const { services, functions } = await compileAqua(pathToAquaFiles);

        aqua = functions;
        sigDef = services.Sig;
        dataProviderDef = services.DataProvider;
    });

    it("Use custom sig service, success path", async () => {
        await withPeer(async (peer) => {
            const customKeyPair = await KeyPair.randomEd25519();
            const customSig = new Sig(customKeyPair);
            const data = [1, 2, 3, 4, 5];

            registerService({
                peer,
                def: sigDef,
                serviceId: "CustomSig",
                service: customSig,
            });

            registerService({
                peer,
                def: dataProviderDef,
                serviceId: "data",
                service: {
                    provide_data: () => {
                        return data;
                    },
                },
            });

            customSig.securityGuard = allowServiceFn("data", "provide_data");

            const result = await aqua.callSig(peer, { sigId: "CustomSig" });

            expect(result.success).toBe(true);

            const isSigCorrect = await customSig.verify(
                result.signature as number[],
                data,
            );

            expect(isSigCorrect).toBe(true);
        });
    });

    it("Use custom sig service, fail path", async () => {
        await withPeer(async (peer) => {
            const customKeyPair = await KeyPair.randomEd25519();
            const customSig = new Sig(customKeyPair);
            const data = [1, 2, 3, 4, 5];

            registerService({
                peer,
                def: sigDef,
                serviceId: "CustomSig",
                service: customSig,
            });

            registerService({
                peer,
                def: dataProviderDef,
                serviceId: "data",
                service: {
                    provide_data: () => {
                        return data;
                    },
                },
            });

            customSig.securityGuard = allowServiceFn("wrong", "wrong");

            const result = await aqua.callSig(peer, { sigId: "CustomSig" });
            expect(result.success).toBe(false);
        });
    });

    it("Default sig service should be resolvable by peer id", async () => {
        await withPeer(async (peer) => {
            const sig = peer.internals.getServices().sig;

            const data = [1, 2, 3, 4, 5];

            registerService({
                peer: peer,
                def: dataProviderDef,
                serviceId: "data",
                service: {
                    provide_data: () => {
                        return data;
                    },
                },
            });

            const callAsSigRes = await aqua.callSig(peer, { sigId: "sig" });

            const callAsPeerIdRes = await aqua.callSig(peer, {
                sigId: peer.keyPair.getPeerId(),
            });

            expect(callAsSigRes.success).toBe(false);
            expect(callAsPeerIdRes.success).toBe(false);

            sig.securityGuard = () => {
                return true;
            };

            const callAsSigResAfterGuardChange = await aqua.callSig(peer, {
                sigId: "sig",
            });

            const callAsPeerIdResAfterGuardChange = await aqua.callSig(peer, {
                sigId: peer.keyPair.getPeerId(),
            });

            expect(callAsSigResAfterGuardChange.success).toBe(true);
            expect(callAsPeerIdResAfterGuardChange.success).toBe(true);

            const isValid = await sig.verify(
                callAsSigResAfterGuardChange.signature as number[],
                data,
            );

            expect(isValid).toBe(true);
        });
    });
});
