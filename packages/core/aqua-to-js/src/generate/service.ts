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

import { ServiceDef } from "@fluencelabs/interfaces";

import { TypeGenerator } from "./interfaces.js";

export interface DefaultServiceId {
  s_Some__f_value?: string;
}

export function generateServices(
  typeGenerator: TypeGenerator,
  services: Record<string, ServiceDef>,
) {
  const generated = Object.entries(services)
    .map(([srvName, srvDef]) => {
      return generateService(typeGenerator, srvName, srvDef);
    })
    .join("\n\n");

  return generated + "\n";
}

function generateService(
  typeGenerator: TypeGenerator,
  srvName: string,
  srvDef: ServiceDef,
) {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const defaultServiceId = (srvDef.defaultServiceId as DefaultServiceId)
    .s_Some__f_value;

  return [
    typeGenerator.serviceType(srvName, srvDef),
    generateRegisterServiceOverload(typeGenerator, srvName, defaultServiceId),
  ].join("\n");
}

function generateRegisterServiceOverload(
  typeGenerator: TypeGenerator,
  srvName: string,
  srvDefaultId?: string,
) {
  return `export function register${srvName}(${typeGenerator.type(
    "...args",
    "any[]",
  )}) {
    const service = args.pop();
    const defaultServiceId = ${
      srvDefaultId != null ? `"${srvDefaultId}"` : "undefined"
    };
            
    const params = args[0] instanceof FluencePeer$$ ? ({
        peer: args[0],
        serviceId: args[1] ?? defaultServiceId
    }) : ({
        peer: undefined,
        serviceId: args[0] ?? defaultServiceId
    });
    
    if (params.serviceId == null) {
        throw new Error("Service ID is not provided");
    }
        
    registerService$$({
        service,
        ...params
    });
}`;
}
