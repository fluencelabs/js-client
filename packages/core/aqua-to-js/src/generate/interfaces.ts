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

import { FunctionCallDef, ServiceDef } from "@fluencelabs/interfaces";

import { genTypeName, typeToTs } from "../common.js";
import { CLIENT } from "../constants.js";
import { capitalize, getFuncArgs } from "../utils.js";

export interface TypeGenerator {
  type(field: string, type: string): string;
  generic(field: string, type: string): string;
  bang(field: string): string;
  funcType(funcDef: AquaFunction): string;
  serviceType(srvName: string, srvDef: ServiceDef): string;
}

export class TSTypeGenerator implements TypeGenerator {
  bang(field: string): string {
    return `${field}!`;
  }

  generic(field: string, type: string): string {
    return `${field}<${type}>`;
  }

  type(field: string, type: string): string {
    return `${field}: ${type}`;
  }

  funcType({ funcDef }: AquaFunction): string {
    const args = getFuncArgs(funcDef.arrow.domain).map(([name, type]) => {
      const [typeDesc, t] = genTypeName(
        type,
        capitalize(funcDef.functionName) + "Arg" + capitalize(name),
      );

      return [typeDesc, `${name}: ${t}`] as const;
    });

    args.push([undefined, `config?: {ttl?: number}`]);

    const argsDefs = args.map(([, def]) => {
      return def;
    });

    const argsDesc = args
      .filter(([desc]) => {
        return desc !== undefined;
      })
      .map(([desc]) => {
        return desc;
      });

    const functionOverloads = [
      argsDefs.join(", "),
      [`peer: ${CLIENT}`, ...argsDefs].join(", "),
    ];

    const [resTypeDesc, resType] = genTypeName(
      funcDef.arrow.codomain,
      capitalize(funcDef.functionName) + "ResultType",
    );

    const functionOverloadArgsType = functionOverloads
      .map((overload) => {
        return `[${overload}]`;
      })
      .join(" | ");

    return [
      argsDesc.join("\n"),
      resTypeDesc ?? "",
      `export type ${capitalize(
        funcDef.functionName,
      )}Params = ${functionOverloadArgsType};`,
      `export type ${capitalize(
        funcDef.functionName,
      )}Result = Promise<${resType}>;\n`,
    ]
      .filter((s) => {
        return s !== "";
      })
      .join("\n\n");
  }

  serviceType(srvName: string, srvDef: ServiceDef): string {
    const members =
      srvDef.functions.tag === "nil"
        ? []
        : Object.entries(srvDef.functions.fields);

    const interfaceDefs = members
      .map(([name, arrow]) => {
        return `    ${name}: ${typeToTs(arrow)};`;
      })
      .join("\n");

    const interfaces = [
      `export interface ${srvName}Def {`,
      interfaceDefs,
      "}",
    ].join("\n");

    const peerDecl = `peer: ${CLIENT}`;
    const serviceDecl = `service: ${srvName}Def`;
    const serviceIdDecl = `serviceId: string`;

    const functionOverloadsWithDefaultServiceId = [
      [serviceDecl],
      [serviceIdDecl, serviceDecl],
      [peerDecl, serviceDecl],
      [peerDecl, serviceIdDecl, serviceDecl],
    ];

    const functionOverloadsWithoutDefaultServiceId = [
      [serviceIdDecl, serviceDecl],
      [peerDecl, serviceIdDecl, serviceDecl],
    ];

    const registerServiceArgs =
      srvDef.defaultServiceId == null
        ? functionOverloadsWithoutDefaultServiceId
        : functionOverloadsWithDefaultServiceId;

    return [
      interfaces,
      ...registerServiceArgs.map((registerServiceArg) => {
        const args = registerServiceArg.join(", ");
        return `export function register${srvName}(${args}): void;`;
      }),
    ].join("\n");
  }
}

export class JSTypeGenerator implements TypeGenerator {
  bang(field: string): string {
    return field;
  }

  generic(field: string): string {
    return field;
  }

  type(field: string): string {
    return field;
  }

  funcType(): string {
    return "";
  }

  serviceType(): string {
    return "";
  }
}

export interface AquaFunction {
  funcDef: FunctionCallDef;
  script: string;
}

export interface CompilationResult {
  services: Record<string, ServiceDef>;
  functions: Record<string, AquaFunction>;
}

export interface EntityGenerator {
  generate(compilationResult: CompilationResult): string;
}

export type OutputType = "js" | "ts";
