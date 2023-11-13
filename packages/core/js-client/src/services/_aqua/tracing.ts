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

/**
 * This compiled aqua file was modified to make it work in monorepo
 */

import { registerService } from "../../compilerSupport/registerService.js";
import { ServiceImpl } from "../../compilerSupport/types.js";
import { FluencePeer } from "../../jsPeer/FluencePeer.js";
import { ParticleContext } from "../../jsServiceHost/interfaces.js";
import { Tracing } from "../Tracing.js";

// Services

export interface TracingDef {
  tracingEvent: (
    arrowName: string,
    event: string,
    callParams: ParticleContext,
  ) => void | Promise<void>;
}

export function registerTracing(
  peer: FluencePeer,
  serviceId: string,
  service: Tracing,
) {
  registerService({
    peer,
    serviceId,
    // TODO: fix this after changing registerService signature
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    service: service as unknown as ServiceImpl,
  });
}

// Functions
