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

import type { CallAquaFunctionArgs } from "./compilerSupport/callFunction.js";
import { ServiceImpl } from "./compilerSupport/types.js";
import { FluencePeer } from "./jsPeer/FluencePeer.js";

import { callAquaFunction, Fluence, registerService } from "./index.js";

export const isFluencePeer = (
  fluencePeerCandidate: unknown,
): fluencePeerCandidate is FluencePeer => {
  return fluencePeerCandidate instanceof FluencePeer;
};

type CallAquaFunctionArgsTuned = Pick<CallAquaFunctionArgs, "args" | "script"> &
  Partial<Pick<CallAquaFunctionArgs, "config" | "peer">>;

type RegisterServiceArgs = {
  peer?: FluencePeer;
  service: ServiceImpl;
  serviceId: string;
};

/**
 * Convenience function to support Aqua `func` generation backend
 * The compiler only need to generate a call the function and provide the air script
 */
export const v5_callFunction = async ({
  config = {},
  peer,
  args,
  script,
}: CallAquaFunctionArgsTuned): Promise<unknown> => {
  if (peer == null) {
    if (Fluence.defaultClient == null) {
      throw new Error(
        "Could not register Aqua service because the client is not initialized. Did you forget to call Fluence.connect()?",
      );
    }

    peer = Fluence.defaultClient;
  }

  return callAquaFunction({
    args,
    script,
    config,
    peer,
  });
};

/**
 * Convenience function to support Aqua `service` generation backend
 * The compiler only need to generate a call the function and provide the air script
 */
export const v5_registerService = ({
  serviceId,
  service,
  peer,
}: RegisterServiceArgs): void => {
  if (peer == null) {
    if (Fluence.defaultClient == null) {
      throw new Error(
        "Could not register Aqua service because the client is not initialized. Did you forget to call Fluence.connect()?",
      );
    }

    peer = Fluence.defaultClient;
  }

  registerService({
    service,
    serviceId,
    peer,
  });
};
