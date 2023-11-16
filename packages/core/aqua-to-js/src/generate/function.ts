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

import { capitalize, recursiveRenameLaquaProps } from "../utils.js";

import { AquaFunction, TypeGenerator } from "./interfaces.js";

export function generateFunctions(
  typeGenerator: TypeGenerator,
  functions: Record<string, AquaFunction>,
) {
  return Object.values(functions)
    .map((func) => {
      return generateFunction(typeGenerator, func);
    })
    .join("\n\n");
}

type DeepToType<T> = { [K in keyof T]: DeepToType<T[K]> };

function generateFunction(typeGenerator: TypeGenerator, func: AquaFunction) {
  const funcDef: DeepToType<typeof func.funcDef> = func.funcDef;
  const scriptConstName = func.funcDef.functionName + "_script";
  return `export const ${scriptConstName} = \`
${func.script}\`;

${typeGenerator.funcType(func)}
export function ${func.funcDef.functionName}(${typeGenerator.type(
    "...args",
    `${func.funcDef.functionName}Params`,
  )})${typeGenerator.type(
    "",
    `${capitalize(func.funcDef.functionName)}Result`,
  )} {
    return callFunction$$(
        args,
        ${JSON.stringify(recursiveRenameLaquaProps(funcDef), null, 4)},
        ${scriptConstName}
    );
}`;
}
