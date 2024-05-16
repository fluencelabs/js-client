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

import { resolve } from "path";

import Arborist from "@npmcli/arborist";
import { breadth } from "treeverse";

export interface GatherImportsArg {
  npmProjectDirPath: string;
  aquaToCompileDirPath?: string; // Default: npmProjectDirPath
  globalImports?: string[];
}

export type GatherImportsResult = Record<
  string,
  Record<string, string[] | string>
>;

export async function gatherImportsFromNpm({
  npmProjectDirPath,
  aquaToCompileDirPath,
  globalImports = [],
}: GatherImportsArg): Promise<GatherImportsResult> {
  const arborist = new Arborist({ path: npmProjectDirPath });
  const tree = await arborist.loadActual();

  /**
   * Traverse dependency tree to construct map
   * (real path of a package) -> (real paths of its immediate dependencies)
   */
  let result: Record<string, Record<string, string>> = {};
  const rootDepsKey = "";
  const aquaDepPath = resolve(aquaToCompileDirPath ?? npmProjectDirPath);

  breadth({
    tree,
    getChildren(node) {
      const deps: Arborist.Node[] = [];

      for (const edge of node.edgesOut.values()) {
        // Skip dependencies that are not installed.

        // Looks like Arborist type is incorrect here, so it's possible to have null here
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (edge.to === null) {
          continue;
        }

        // NOTE: Any errors in edge are ignored.
        const dep = edge.to;

        // Gather dependencies to traverse them.
        deps.push(dep);

        // Root node should have top-level property pointed to aqua dependency folder
        if (node.isRoot) {
          result[rootDepsKey] = {
            ...result[rootDepsKey],
            [dep.name]: dep.realpath,
          };
        } else {
          // Gather dependencies real paths.
          result[node.realpath] = {
            ...(result[node.realpath] ?? {}),
            [dep.name]: dep.realpath,
          };
        }
      }

      return deps;
    },
  });

  // In case 'aquaToCompileDirPath' points to any dependency inside current project
  // Only the subtree with 'aquaToCompileDirPath' as root node is returned
  if (aquaToCompileDirPath !== undefined && aquaDepPath in result) {
    // Other nodes which are not included in the subtree simply dropped
    const newResult: Record<string, Record<string, string>> = {};

    breadth({
      tree: aquaDepPath,
      getChildren: (node) => {
        const deps = result[node];

        if (deps === undefined) {
          return [];
        }

        const isRootNode = node === aquaDepPath;
        newResult[isRootNode ? rootDepsKey : node] = deps;
        return Object.values(deps);
      },
    });

    result = newResult;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [rootDepsKey]: _, ...rest } = result;

  return {
    ...rest,
    [aquaDepPath]: {
      ...result[rootDepsKey],
      "": globalImports,
    },
  };
}
