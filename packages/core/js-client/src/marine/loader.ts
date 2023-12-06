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

import { fetchResource } from "@fluencelabs/js-client-isomorphic/fetcher";
import { getWorker } from "@fluencelabs/js-client-isomorphic/worker-resolver";
import { Worker } from "@fluencelabs/threads/master";

type StrategyReturnType = [
  marineJsWasm: ArrayBuffer,
  avmWasm: ArrayBuffer,
  worker: Worker,
];

export const loadMarineDeps = async (
  CDNUrl: string,
): Promise<StrategyReturnType> => {
  const [marineJsWasm, avmWasm] = await Promise.all([
    fetchResource(
      "@fluencelabs/marine-js",
      "/dist/marine-js.wasm",
      CDNUrl,
    ).then((res) => {
      return res.arrayBuffer();
    }),
    fetchResource("@fluencelabs/avm", "/dist/avm.wasm", CDNUrl).then((res) => {
      return res.arrayBuffer();
    }),
  ]);

  // TODO: load worker in parallel with avm and marine, test that it works
  const worker = await getWorker("@fluencelabs/marine-worker", CDNUrl);

  return [marineJsWasm, avmWasm, worker];
};
