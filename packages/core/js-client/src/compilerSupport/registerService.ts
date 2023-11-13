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

import { FluencePeer } from "../jsPeer/FluencePeer.js";
import { logger } from "../util/logger.js";

import { registerGlobalService, userHandlerService } from "./services.js";
import { ServiceImpl } from "./types.js";

const log = logger("aqua");

interface RegisterServiceArgs {
  peer: FluencePeer;
  serviceId: string | undefined;
  service: ServiceImpl;
}

const findAllPossibleServiceMethods = (service: ServiceImpl): Set<string> => {
  let prototype: Record<string, unknown> = service;
  const serviceMethods = new Set<string>();

  do {
    Object.getOwnPropertyNames(prototype)
      .filter((prop) => {
        return typeof prototype[prop] === "function" && prop !== "constructor";
      })
      .forEach((prop) => {
        return serviceMethods.add(prop);
      });

    // Satisfying typescript here
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    prototype = Object.getPrototypeOf(prototype) as Record<string, unknown>;
  } while (prototype.constructor !== Object);

  return serviceMethods;
};

export const registerService = ({
  peer,
  serviceId,
  service,
}: RegisterServiceArgs) => {
  // TODO: Need to refactor this. We can compute function types from service implementation, making func more type safe
  log.trace("registering aqua service %o", { serviceId, service });

  if (serviceId == null) {
    throw new Error("Service ID must be specified");
  }

  const serviceMethods = findAllPossibleServiceMethods(service);

  for (const method of serviceMethods) {
    // The function has type of (arg1, arg2, arg3, ... , ParticleContext) => CallServiceResultType | void
    // Account for the fact that user service might be defined as a class - .bind(...)
    const handler = service[method];
    const userDefinedHandler = handler.bind(service);

    const serviceDescription = userHandlerService(
      serviceId,
      method,
      userDefinedHandler,
    );

    registerGlobalService(peer, serviceDescription);
  }

  log.trace("aqua service registered %s", serviceId);
};
