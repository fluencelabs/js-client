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

import { ServiceDef } from "@fluencelabs/interfaces";

import { recursiveRenameLaquaProps } from "../utils.js";

import { TypeGenerator } from "./interfaces.js";

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
  return [
    typeGenerator.serviceType(srvName, srvDef),
    generateRegisterServiceOverload(typeGenerator, srvName, srvDef),
  ].join("\n");
}

function generateRegisterServiceOverload(
  typeGenerator: TypeGenerator,
  srvName: string,
  srvDef: ServiceDef,
) {
  return [
    `export function register${srvName}(${typeGenerator.type(
      "...args",
      "any[]",
    )}) {`,
    "    registerService$$(",
    "        args,",
    `        ${serviceToJson(srvDef)}`,
    "    );",
    "}",
  ].join("\n");
}

function serviceToJson(service: ServiceDef): string {
  const record: Record<never, unknown> = service;
  return JSON.stringify(recursiveRenameLaquaProps(record), null, 4);
}
