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

import Arborist from "@npmcli/arborist";
import { breadth } from "treeverse";

export async function gatherImportsFromNpm(
  path: string,
): Promise<Record<string, string[]>> {
  const arb = new Arborist({ path });

  return await gatherImportsFromArborist(arb);
}

export async function gatherImportsFromArborist(
  arborist: Arborist,
): Promise<Record<string, string[]>> {
  const tree = await arborist.loadActual();

  /**
   * Traverse dependency tree to construct map
   * (real path of a package) -> (real paths of its immediate dependencies)
   */
  const result = new Map<string, string[]>();

  breadth({
    tree,
    getChildren(node, _) {
      const deps: Arborist.Node[] = [];

      for (const edge of node.edgesOut.values()) {
        // Skip dependencies that are not installed.
        if (edge.to === null) {
          continue;
        }
        // NOTE: Any errors in edge are ignored.
        const dep = edge.to;

        // Gather dependencies to traverse them.
        deps.push(dep);

        // Gather dependencies real paths.
        result.set(node.realpath, [
          ...(result.get(node.realpath) || []),
          dep.realpath,
        ]);
      }

      return deps;
    },
  });

  // Convert a map to object.
  return Object.fromEntries(result);
}
