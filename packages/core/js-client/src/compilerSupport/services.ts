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
import {
  CallServiceData,
  GenericCallServiceHandler,
  ResultCodes,
} from "../jsServiceHost/interfaces.js";
import { Particle } from "../particle/Particle.js";
import type { JSONValue } from "../util/types.js";

import { ServiceImpl } from "./types.js";

export interface ServiceDescription {
  serviceId: string;
  fnName: string;
  handler: GenericCallServiceHandler;
}

/**
 * Creates a service which injects relay's peer id into aqua space
 */
export const injectRelayService = (peer: FluencePeer) => {
  return {
    serviceId: "getDataSrv",
    fnName: "-relay-",
    handler: () => {
      return {
        retCode: ResultCodes.success,
        result: peer.internals.getRelayPeerId(),
      };
    },
  };
};

/**
 * Creates a service which injects plain value into aqua space
 */
export const injectValueService = (
  serviceId: string,
  fnName: string,
  value: JSONValue,
) => {
  return {
    serviceId: serviceId,
    fnName: fnName,
    handler: () => {
      return {
        retCode: ResultCodes.success,
        result: value,
      };
    },
  };
};

/**
 *  Creates a service which is used to return value from aqua function into typescript space
 */
export const responseService = (resolveCallback: (val: JSONValue) => void) => {
  return {
    serviceId: "callbackSrv",
    fnName: "response",
    handler: (req: CallServiceData) => {
      const userFunctionReturn =
        req.args.length === 0
          ? null
          : req.args.length === 1 && "0" in req.args
          ? req.args[0]
          : req.args;

      setTimeout(() => {
        resolveCallback(userFunctionReturn);
      }, 0);

      return {
        retCode: ResultCodes.success,
        result: {},
      };
    },
  };
};

/**
 * Creates a service which is used to return errors from aqua function into typescript space
 */
export const errorHandlingService = (
  rejectCallback: (err: JSONValue) => void,
) => {
  return {
    serviceId: "errorHandlingSrv",
    fnName: "error",
    handler: (req: CallServiceData) => {
      const [err] = req.args;

      setTimeout(() => {
        rejectCallback(
          err ??
            "Unknown error happened when executing aqua code. No error text was passed to 'errorHandlingSrv.error' function, probably because AIR code was modified or aqua compiler didn't produce the correct call",
        );
      }, 0);

      return {
        retCode: ResultCodes.success,
        result: {},
      };
    },
  };
};

/**
 * Creates a service for user-defined service function handler
 */
export const userHandlerService = (
  serviceId: string,
  fnName: string,
  userHandler: ServiceImpl[string],
) => {
  return {
    serviceId,
    fnName,
    handler: async (req: CallServiceData) => {
      const { args, particleContext: context } = req;

      const result = await userHandler.bind(null)({
        args,
        context,
      });

      return {
        retCode: ResultCodes.success,
        result: result,
      };
    },
  };
};

export const registerParticleScopeService = (
  peer: FluencePeer,
  particle: Particle,
  service: ServiceDescription,
) => {
  peer.internals.regHandler.forParticle(
    particle.id,
    service.serviceId,
    service.fnName,
    service.handler,
  );
};

export const registerGlobalService = (
  peer: FluencePeer,
  service: ServiceDescription,
) => {
  peer.internals.regHandler.common(
    service.serviceId,
    service.fnName,
    service.handler,
  );
};
