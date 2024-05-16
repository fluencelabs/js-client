/**
 * Copyright 2024 Fluence DAO
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
  serviceId: string;
  service: ServiceImpl;
}

type ServiceFunctionPair = [key: string, value: ServiceImpl[string]];

// This function iterates on plain object or class instance functions ignoring inherited functions and prototype chain.
const findAllPossibleRegisteredServiceFunctions = (
  service: ServiceImpl,
): Array<ServiceFunctionPair> => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const prototype = Object.getPrototypeOf(service) as ServiceImpl;

  const isClassInstance = prototype.constructor !== Object;

  if (isClassInstance) {
    service = prototype;
  }

  return Object.getOwnPropertyNames(service)
    .map((prop) => {
      return [prop, service[prop]];
    })
    .filter((entry): entry is ServiceFunctionPair => {
      const [prop, value] = entry;
      return typeof value === "function" && prop !== "constructor";
    });
};

export const registerService = ({
  peer,
  serviceId,
  service,
}: RegisterServiceArgs) => {
  log.trace("registering aqua service %o", { serviceId, service });

  const serviceFunctions = findAllPossibleRegisteredServiceFunctions(service);

  for (const [serviceFunction, handler] of serviceFunctions) {
    const userDefinedHandler = handler.bind(service);

    const serviceDescription = userHandlerService(
      serviceId,
      serviceFunction,
      userDefinedHandler,
    );

    registerGlobalService(peer, serviceDescription);
  }

  log.trace("aqua service registered %s", serviceId);
};
