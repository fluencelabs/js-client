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
import {
  CallParams,
  ArrowWithoutCallbacks,
  FunctionCallDef,
  NonArrowType,
  ServiceImpl,
  JSONValue,
} from "@fluencelabs/interfaces";
import { fromUint8Array } from "js-base64";
import { match } from "ts-pattern";

import { FluencePeer } from "../jsPeer/FluencePeer.js";
import {
  CallServiceData,
  GenericCallServiceHandler,
  ResultCodes,
} from "../jsServiceHost/interfaces.js";
import { Particle } from "../particle/Particle.js";

import {
  aquaArgs2Ts,
  responseServiceValue2ts,
  returnType2Aqua,
  ts2aqua,
} from "./conversions.js";

export interface ServiceDescription {
  serviceId: string;
  fnName: string;
  handler: GenericCallServiceHandler;
}

/**
 * Creates a service which injects relay's peer id into aqua space
 */
export const injectRelayService = (def: FunctionCallDef, peer: FluencePeer) => {
  return {
    serviceId: def.names.getDataSrv,
    fnName: def.names.relay,
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
  valueType: NonArrowType,
  value: JSONValue,
) => {
  return {
    serviceId: serviceId,
    fnName: fnName,
    handler: () => {
      return {
        retCode: ResultCodes.success,
        result: ts2aqua(value, valueType),
      };
    },
  };
};

/**
 *  Creates a service which is used to return value from aqua function into typescript space
 */
export const responseService = (
  def: FunctionCallDef,
  resolveCallback: (val: JSONValue) => void,
) => {
  return {
    serviceId: def.names.responseSrv,
    fnName: def.names.responseFnName,
    handler: (req: CallServiceData) => {
      const userFunctionReturn = responseServiceValue2ts(req, def.arrow);

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
  def: FunctionCallDef,
  rejectCallback: (err: JSONValue) => void,
) => {
  return {
    serviceId: def.names.errorHandlingSrv,
    fnName: def.names.errorFnName,
    handler: (req: CallServiceData) => {
      const [err] = req.args;

      setTimeout(() => {
        rejectCallback(err);
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
  arrowType: [string, ArrowWithoutCallbacks],
  userHandler: ServiceImpl[string],
) => {
  const [fnName, type] = arrowType;
  return {
    serviceId,
    fnName,
    handler: async (req: CallServiceData) => {
      const args: [...JSONValue[], CallParams<string>] = [
        ...aquaArgs2Ts(req, type),
        extractCallParams(req, type),
      ];

      const rawResult = await userHandler.bind(null)(...args);
      const result = returnType2Aqua(rawResult, type);

      return {
        retCode: ResultCodes.success,
        result: result,
      };
    },
  };
};

/**
 * Extracts call params from from call service data according to aqua type definition
 */
const extractCallParams = (
  req: CallServiceData,
  arrow: ArrowWithoutCallbacks,
): CallParams<string> => {
  const names: (string | undefined)[] = match(arrow.domain)
    .with({ tag: "nil" }, () => {
      return [];
    })
    .with({ tag: "unlabeledProduct" }, (x) => {
      return x.items.map((_, index) => {
        return "arg" + index;
      });
    })
    .with({ tag: "labeledProduct" }, (x) => {
      return Object.keys(x.fields);
    })
    .exhaustive();

  const tetraplets: Record<string, SecurityTetraplet[]> = {};

  for (let i = 0; i < req.args.length; i++) {
    const name = names[i];

    if (name != null) {
      tetraplets[name] = req.tetraplets[i];
    }
  }

  const callParams = {
    ...req.particleContext,
    signature: fromUint8Array(req.particleContext.signature),
    tetraplets,
  };

  return callParams;
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
