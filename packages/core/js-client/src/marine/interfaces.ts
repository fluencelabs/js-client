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

import { CallParameters } from "@fluencelabs/marine-worker";

import { IStartable } from "../util/commonTypes.js";
import type { JSONObject, JSONValue, JSONArray } from "../util/types.js";

/**
 * Contract for marine host implementations. Marine host is responsible for creating calling and removing marine services
 */
export interface IMarineHost extends IStartable {
  /**
   * Creates marine service from the given module and service id
   */
  createService(
    serviceModule: ArrayBuffer | SharedArrayBuffer,
    serviceId: string,
  ): Promise<void>;

  /**
   * Removes marine service with the given service id
   */
  removeService(serviceId: string): Promise<void>;

  /**
   * Returns true if any service with the specified service id is registered
   */
  hasService(serviceId: string): Promise<boolean>;

  /**
   * Calls the specified function of the specified service with the given arguments
   */
  callService(
    serviceId: string,
    functionName: string,
    args: JSONArray | JSONObject,
    callParams?: CallParameters,
  ): Promise<JSONValue>;
}
