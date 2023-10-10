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

import type { ServiceDef, ServiceImpl } from "@fluencelabs/interfaces";

import { FluencePeer } from "../jsPeer/FluencePeer.js";
import { logger } from "../util/logger.js";

import { registerGlobalService, userHandlerService } from "./services.js";

const log = logger("aqua");

interface RegisterServiceArgs {
  peer: FluencePeer;
  def: ServiceDef;
  serviceId: string | undefined;
  service: ServiceImpl;
}

export const registerService = ({
  peer,
  def,
  serviceId = def.defaultServiceId,
  service,
}: RegisterServiceArgs) => {
  // TODO: Need to refactor this. We can compute function types from service implementation, making func more type safe
  log.trace("registering aqua service %o", { def, serviceId, service });

  // Checking for missing keys
  const requiredKeys =
    def.functions.tag === "nil" ? [] : Object.keys(def.functions.fields);

  const incorrectServiceDefinitions = requiredKeys.filter((f) => {
    return !(f in service);
  });

  if (serviceId == null) {
    throw new Error("Service ID must be specified");
  }

  if (incorrectServiceDefinitions.length > 0) {
    throw new Error(
      `Error registering service ${serviceId}: missing functions: ` +
        incorrectServiceDefinitions
          .map((d) => {
            return "'" + d + "'";
          })
          .join(", "),
    );
  }

  const singleFunctions =
    def.functions.tag === "nil" ? [] : Object.entries(def.functions.fields);

  for (const singleFunction of singleFunctions) {
    const [name] = singleFunction;
    // The function has type of (arg1, arg2, arg3, ... , callParams) => CallServiceResultType | void
    // Account for the fact that user service might be defined as a class - .bind(...)
    const userDefinedHandler = service[name].bind(service);

    const serviceDescription = userHandlerService(
      serviceId,
      singleFunction,
      userDefinedHandler,
    );

    registerGlobalService(peer, serviceDescription);
  }

  log.trace("aqua service registered %s", serviceId);
};
