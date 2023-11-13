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

import { writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import { compileFromPath } from "@fluencelabs/aqua-api";
import aquaToJs from "@fluencelabs/aqua-to-js";

const files = ["smoke_test", "finalize_particle"];

for (const file of files) {
  const cr = await compileFromPath({
    filePath: join(
      dirname(fileURLToPath(import.meta.url)),
      "_aqua",
      file + ".aqua",
    ),
    targetType: "air",
    imports: [fileURLToPath(new URL("./node_modules", import.meta.url))],
  });

  const res = await aquaToJs(cr, "ts");

  if (res == null) {
    throw new Error(cr.errors.join("\n"));
  }

  await writeFile(
    fileURLToPath(new URL(join("src", "_aqua", file + ".ts"), import.meta.url)),
    res.sources,
  );
}
