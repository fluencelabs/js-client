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

import { recursiveRenameLaquaProps } from "../utils.js";

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

function generateFunction(typeGenerator: TypeGenerator, func: AquaFunction) {
  const scriptConstName = func.funcDef.functionName + "_script";
  const codomain = func.funcDef.arrow.codomain;

  const valueSchema =
    codomain.tag === "unlabeledProduct" && codomain.items.length === 1
      ? codomain.items[0]
      : codomain;

  const valueSchemaString = JSON.stringify(
    recursiveRenameLaquaProps(valueSchema),
    null,
    4,
  );

  const domain = func.funcDef.arrow.domain;
  const argNames = domain.tag === "nil" ? [] : Object.keys(domain.fields);

  return `export const ${scriptConstName} = \`
${func.script}\`;

${typeGenerator.funcType(func)}
export async function ${func.funcDef.functionName}(${typeGenerator.type(
    "...args",
    "any[]",
  )}) {
    const argNames = [${argNames
      .map((arg) => {
        return `"${arg}"`;
      })
      .join(", ")}];
    const argCount = argNames.length;
    let peer = undefined;
    if (args[0] instanceof FluencePeer$$) {
        peer = args[0];
        args = args.slice(1);
    }
    
    
    const callArgs = Object.fromEntries(args.slice(0, argCount).map((arg, i) => [argNames[i], arg]));
    
    const params = ({
        peer,
        args: callArgs,
        config: args[argCount]
    });
    
    const result = await callFunction$$({
        script: ${scriptConstName},
        ...params,
    });
    
    return aqua2ts(result, 
    ${valueSchemaString}
    ); 
}`;
}
