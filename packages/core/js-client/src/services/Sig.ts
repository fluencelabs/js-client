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

import { ServiceFnArgs } from "../compilerSupport/types.js";
import { KeyPair } from "../keypair/index.js";
import type { PeerIdB58 } from "../util/types.js";

import {
  allowOnlyParticleOriginatedAt,
  allowServiceFn,
  and,
  or,
  SecurityGuard,
} from "./securityGuard.js";

export const defaultSigGuard = (peerId: PeerIdB58) => {
  return and(
    allowOnlyParticleOriginatedAt(peerId),
    or(
      allowServiceFn("trust-graph", "get_trust_bytes"),
      allowServiceFn("trust-graph", "get_revocation_bytes"),
      allowServiceFn("registry", "get_key_bytes"),
      allowServiceFn("registry", "get_record_bytes"),
      allowServiceFn("registry", "get_record_metadata_bytes"),
      allowServiceFn("registry", "get_tombstone_bytes"),
    ),
  );
};

type SignReturnType =
  | {
      error: [];
      signature: [number[]];
      success: true;
    }
  | {
      error: [string];
      signature: [];
      success: false;
    };

export class Sig {
  constructor(private keyPair: KeyPair) {}

  /**
   * Configurable security guard for sign method
   */
  securityGuard: SecurityGuard = () => {
    return true;
  };

  /**
   * Gets the public key of KeyPair. Required by aqua
   */
  get_peer_id() {
    return this.keyPair.getPeerId();
  }

  /**
   * Signs the data using key pair's private key. Required by aqua
   */
  async sign({
    args: [data],
    context,
  }: ServiceFnArgs<[number[]]>): Promise<SignReturnType> {
    if (!this.securityGuard(context)) {
      return {
        success: false,
        error: ["Security guard validation failed"],
        signature: [],
      };
    }

    const signedData = await this.keyPair.signBytes(Uint8Array.from(data));

    return {
      success: true,
      error: [],
      signature: [Array.from(signedData)],
    };
  }

  /**
   * Verifies the signature. Required by aqua
   */
  verify({
    args: [signature, data],
  }: ServiceFnArgs<[number[], number[]]>): Promise<boolean> {
    return this.keyPair.verify(
      Uint8Array.from(data),
      Uint8Array.from(signature),
    );
  }
}
