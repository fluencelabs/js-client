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

import { ServiceDef, ServiceImpl } from '@fluencelabs/interfaces';
import { it, describe, expect, beforeAll } from "vitest";

import { registerService } from "../../compilerSupport/registerService.js";
import { KeyPair } from "../../keypair/index.js";
import { compileAqua, CompiledFnCall, withPeer } from "../../util/testUtils.js";
import { allowServiceFn } from "../securityGuard.js";
import { Sig } from "../Sig.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

let aqua: Record<string, CompiledFnCall>;
let sigDef: ServiceDef;
let dataProviderDef: ServiceDef;

describe("Sig service test suite", () => {
    beforeAll(async () => {
        const pathToAquaFiles = path.join(
            __dirname,
            "../../../aqua_test/sigService.aqua",
        );

        const { services, functions } = await compileAqua(pathToAquaFiles);

        aqua = functions;
        sigDef = services["Sig"];
        dataProviderDef = services["DataProvider"];
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
                // TODO: fix this after changing registerService signature
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                service: customSig as unknown as ServiceImpl,
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

            const result = await aqua["callSig"](peer, { sigId: "CustomSig" });

            expect(result).toHaveProperty("success", true);

            const isSigCorrect = await customSig.verify(
                // TODO: Use compiled ts wrappers
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                (result as { signature: number[] }).signature,
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
                // TODO: fix this after changing registerService signature
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                service: customSig as unknown as ServiceImpl,
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

            const result = await aqua["callSig"](peer, { sigId: "CustomSig" });
            expect(result).toHaveProperty("success", false);
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

            const callAsSigRes = await aqua["callSig"](peer, { sigId: "sig" });

            const callAsPeerIdRes = await aqua["callSig"](peer, {
                sigId: peer.keyPair.getPeerId(),
            });

            expect(callAsSigRes).toHaveProperty("success", false);
            expect(callAsPeerIdRes).toHaveProperty("success", false);

            sig.securityGuard = () => {
                return true;
            };

            const callAsSigResAfterGuardChange = await aqua["callSig"](peer, {
                sigId: "sig",
            });

            const callAsPeerIdResAfterGuardChange = await aqua["callSig"](
                peer,
                {
                    sigId: peer.keyPair.getPeerId(),
                },
            );

            expect(callAsSigResAfterGuardChange).toHaveProperty(
                "success",
                true,
            );

            expect(callAsPeerIdResAfterGuardChange).toHaveProperty(
                "success",
                true,
            );

            const isValid = await sig.verify(
                // TODO: Use compiled ts wrappers
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                (callAsSigResAfterGuardChange as { signature: number[] })
                    .signature,
                data,
            );

            expect(isValid).toBe(true);
        });
    });
});
