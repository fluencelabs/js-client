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

import { generateSources, generateTypes } from "./generate/index.js";
import { CompilationResult } from "./generate/interfaces.js";
import { getPackageJsonContent } from "./utils.js";

interface JsOutput {
  sources: string;
  types: string;
}

interface TsOutput {
  sources: string;
}

type NothingToGenerate = null;

export default async function aquaToJs(
  res: CompilationResult,
  outputType: "js",
): Promise<JsOutput | NothingToGenerate>;

export default async function aquaToJs(
  res: CompilationResult,
  outputType: "ts",
): Promise<TsOutput | NothingToGenerate>;

export default async function aquaToJs(
  res: CompilationResult,
  outputType: "js" | "ts",
): Promise<JsOutput | TsOutput | NothingToGenerate> {
  if (
    Object.keys(res.services).length === 0 &&
    Object.keys(res.functions).length === 0
  ) {
    return null;
  }

  const packageJson = await getPackageJsonContent();

  if (outputType === "js") {
    return {
      sources: generateSources(res, "js", packageJson),
      types: generateTypes(res, packageJson),
    };
  }

  return {
    sources: generateSources(res, "ts", packageJson),
  };
}
