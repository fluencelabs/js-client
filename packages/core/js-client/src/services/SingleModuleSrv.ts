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

import { Buffer } from "buffer";

import { v4 as uuidv4 } from "uuid";

import { FluencePeer } from "../jsPeer/FluencePeer.js";
import { ParticleContext } from "../jsServiceHost/interfaces.js";
import { getErrorMessage } from "../util/utils.js";

import {
  allowOnlyParticleOriginatedAt,
  SecurityGuard,
} from "./securityGuard.js";

export const defaultGuard = (peer: FluencePeer) => {
  return allowOnlyParticleOriginatedAt(peer.getPeerId());
};

// Service for registering marine modules in js-client's marine runtime
export class Srv {
  private services: Set<string> = new Set();

  constructor(private peer: FluencePeer) {
    this.securityGuard_create = defaultGuard(this.peer);
    this.securityGuard_remove = defaultGuard(this.peer);
  }

  securityGuard_create: SecurityGuard;

  async create(wasm_b64_content: string, callParams: ParticleContext) {
    if (!this.securityGuard_create(callParams)) {
      return {
        success: false,
        error: ["Marine services could be registered on %init_peer_id% only"],
        service_id: null,
      };
    }

    try {
      const newServiceId = uuidv4();
      const buffer = Buffer.from(wasm_b64_content, "base64");
      // TODO:: figure out why SharedArrayBuffer is not working here
      // const sab = new SharedArrayBuffer(buffer.length);
      // const tmp = new Uint8Array(sab);
      // tmp.set(buffer, 0);
      await this.peer.registerMarineService(buffer, newServiceId);
      this.services.add(newServiceId);

      return {
        success: true,
        service_id: [newServiceId],
        error: null,
      };
    } catch (err: unknown) {
      return {
        success: true,
        service_id: null,
        error: [getErrorMessage(err)],
      };
    }
  }

  securityGuard_remove: SecurityGuard;

  async remove(service_id: string, callParams: ParticleContext) {
    if (!this.securityGuard_remove(callParams)) {
      return {
        success: false,
        error: ["Marine services could be remove on %init_peer_id% only"],
        service_id: null,
      };
    }

    if (!this.services.has(service_id)) {
      return {
        success: false,
        error: [`Service with id ${service_id} not found`],
      };
    }

    await this.peer.removeMarineService(service_id);
    this.services.delete(service_id);

    return {
      success: true,
      error: null,
    };
  }

  list() {
    return Array.from(this.services.values());
  }
}
