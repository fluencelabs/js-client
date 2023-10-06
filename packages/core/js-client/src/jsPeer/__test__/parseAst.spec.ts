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

import { it, describe, expect } from "vitest";

import { withPeer } from "../../util/testUtils.js";

describe("Parse ast tests", () => {
    it("Correct ast should be parsed correctly", async () => {
        await withPeer(async (peer) => {
            const air = `(null)`;
            const res = await peer.internals.parseAst(air);

            expect(res).toStrictEqual({
                success: true,
                data: { Null: null },
            });
        });
    });

    it("Incorrect ast should result in corresponding error", async () => {
        await withPeer(async (peer) => {
            const air = `(null`;
            const res = await peer.internals.parseAst(air);

            expect(res).toStrictEqual({
                success: false,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                data: expect.stringContaining("error"),
            });
        });
    });
});
