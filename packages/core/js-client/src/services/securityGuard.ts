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

import { SecurityTetraplet } from "@fluencelabs/avm";

import { ParticleContext } from "../jsServiceHost/interfaces.js";
import type { PeerIdB58 } from "../util/types.js";

// Helpers for validating service function

/**
 * A predicate of call params for sig service's sign method which determines whether signing operation is allowed or not
 */
export type SecurityGuard = (params: ParticleContext) => boolean;

/**
 * Only allow calls when tetraplet for 'data' argument satisfies the predicate
 */
export const allowTetraplet = (
  pred: (tetraplet: SecurityTetraplet) => boolean,
): SecurityGuard => {
  return (params) => {
    const t = params.tetraplets[0]?.[0];
    return t !== undefined && pred(t);
  };
};

/**
 * Only allow data which comes from the specified serviceId and fnName
 */
export const allowServiceFn = (
  serviceId: string,
  fnName: string,
): SecurityGuard => {
  return allowTetraplet((t) => {
    return t.service_id === serviceId && t.function_name === fnName;
  });
};

/**
 * Only allow data originated from the specified json_path
 */
export const allowExactJsonPath = (jsonPath: string): SecurityGuard => {
  return allowTetraplet((t) => {
    return t.lens === jsonPath;
  });
};

/**
 * Only allow signing when particle is initiated at the specified peer
 */
export const allowOnlyParticleOriginatedAt = (
  peerId: PeerIdB58,
): SecurityGuard => {
  return (params) => {
    return params.initPeerId === peerId;
  };
};

/**
 * Only allow signing when all of the predicates are satisfied.
 * Useful for predicates reuse
 */
export const and = (...predicates: SecurityGuard[]): SecurityGuard => {
  return (params) => {
    return predicates.every((x) => {
      return x(params);
    });
  };
};

/**
 * Only allow signing when any of the predicates are satisfied.
 * Useful for predicates reuse
 */
export const or = (...predicates: SecurityGuard[]): SecurityGuard => {
  return (params) => {
    return predicates.some((x) => {
      return x(params);
    });
  };
};
