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

import { Worker } from "../../../node_modules/threads/dist/index.js";
// eslint-disable-next-line import/order
import type { WorkerImplementation } from "../../../node_modules/threads/dist/types/master.js";

import { LazyLoader } from "../interfaces.js";

export class WorkerLoader extends LazyLoader<WorkerImplementation> {
  constructor() {
    super(() => {
      return new Worker(
        "../../../node_modules/@fluencelabs/marine-worker/dist/index.js",
      );
    });
  }
}
