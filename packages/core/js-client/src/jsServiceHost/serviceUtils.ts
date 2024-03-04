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

import { SecurityTetraplet } from "@fluencelabs/avm";

import { FluencePeer } from "../jsPeer/FluencePeer.js";
import { IParticle } from "../particle/interfaces.js";
import { builtInServices } from "../services/builtins.js";
import type { JSONArray } from "../util/types.js";

import {
  CallServiceData,
  CallServiceResult,
  CallServiceResultType,
  ParticleContext,
  ResultCodes,
} from "./interfaces.js";

export const WrapFnIntoServiceCall = (
  fn: (args: JSONArray) => CallServiceResultType | undefined,
) => {
  return (req: CallServiceData): CallServiceResult => {
    return {
      retCode: ResultCodes.success,
      result: fn(req.args) ?? null,
    };
  };
};

export class ServiceError extends Error {
  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, ServiceError.prototype);
  }
}

export const getParticleContext = (
  particle: IParticle,
  tetraplets: SecurityTetraplet[][],
): ParticleContext => {
  return {
    particleId: particle.id,
    initPeerId: particle.initPeerId,
    timestamp: particle.timestamp,
    ttl: particle.ttl,
    signature: particle.signature,
    tetraplets,
  };
};

export function registerDefaultServices(peer: FluencePeer) {
  Object.entries(builtInServices).forEach(([serviceId, service]) => {
    Object.entries(service).forEach(([fnName, fn]) => {
      const wrapped = async (req: CallServiceData) => {
        const res = await fn(req);

        if (
          res.retCode === ResultCodes.error &&
          typeof res.result === "string"
        ) {
          return {
            retCode: ResultCodes.error,
            result: `("${serviceId}" "${fnName}") ${res.result}`,
          };
        }

        return res;
      };

      peer.internals.regHandler.common(serviceId, fnName, wrapped);
    });
  });
}
