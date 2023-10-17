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

import {
  CallServiceData,
  CallServiceResult,
  GenericCallServiceHandler,
  IJsServiceHost,
} from "./interfaces.js";

export class JsServiceHost implements IJsServiceHost {
  private particleScopeHandlers = new Map<
    string,
    Map<string, GenericCallServiceHandler>
  >();
  private commonHandlers = new Map<string, GenericCallServiceHandler>();

  /**
   * Returns true if any handler for the specified serviceId is registered
   */
  hasService(serviceId: string): boolean {
    return (
      this.commonHandlers.has(serviceId) ||
      this.particleScopeHandlers.has(serviceId)
    );
  }

  /**
   * Removes all handlers associated with the specified particle scope
   * @param particleId Particle ID to remove handlers for
   */
  removeParticleScopeHandlers(particleId: string): void {
    this.particleScopeHandlers.delete(particleId);
  }

  /**
   * Find call service handler for specified particle
   * @param serviceId Service ID as specified in `call` air instruction
   * @param fnName Function name as specified in `call` air instruction
   * @param particleId Particle ID
   */
  getHandler(
    serviceId: string,
    fnName: string,
    particleId: string,
  ): GenericCallServiceHandler | null {
    const key = serviceFnKey(serviceId, fnName);
    return (
      this.particleScopeHandlers.get(particleId)?.get(key) ??
      this.commonHandlers.get(key) ??
      null
    );
  }

  /**
   * Execute service call for specified call service data. Return null if no handler was found
   */
  async callService(req: CallServiceData): Promise<CallServiceResult | null> {
    const handler = this.getHandler(
      req.serviceId,
      req.fnName,
      req.particleContext.particleId,
    );

    if (handler === null) {
      return null;
    }

    const result = await handler(req);

    // Otherwise AVM might break
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (result.result === undefined) {
      result.result = null;
    }

    return result;
  }

  /**
   * Register handler for all particles
   */
  registerGlobalHandler(
    serviceId: string,
    fnName: string,
    handler: GenericCallServiceHandler,
  ): void {
    this.commonHandlers.set(serviceFnKey(serviceId, fnName), handler);
  }

  /**
   * Register handler which will be called only for particle with the specific id
   */
  registerParticleScopeHandler(
    particleId: string,
    serviceId: string,
    fnName: string,
    handler: GenericCallServiceHandler,
  ): void {
    let psh = this.particleScopeHandlers.get(particleId);

    if (psh === undefined) {
      psh = new Map<string, GenericCallServiceHandler>();
      this.particleScopeHandlers.set(particleId, psh);
    }

    psh.set(serviceFnKey(serviceId, fnName), handler);
  }
}

function serviceFnKey(serviceId: string, fnName: string) {
  return `${serviceId}/${fnName}`;
}
