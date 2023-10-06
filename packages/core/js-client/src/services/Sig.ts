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

import { CallParams, PeerIdB58 } from '@fluencelabs/interfaces';

import { KeyPair } from "../keypair/index.js";

import { SigDef } from "./_aqua/services.js";
import {
    allowOnlyParticleOriginatedAt,
    allowServiceFn,
    and,
    or,
    SecurityGuard,
} from "./securityGuard.js";

export const defaultSigGuard = (peerId: PeerIdB58) => {
    return and<"data">(
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
          error: null;
          signature: number[];
          success: true;
      }
    | {
          error: string;
          signature: null;
          success: false;
      };

export class Sig implements SigDef {
    constructor(private keyPair: KeyPair) {}

    /**
     * Configurable security guard for sign method
     */
    securityGuard: SecurityGuard<"data"> = () => {
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
    async sign(
        data: number[],
        callParams: CallParams<"data">,
    ): Promise<SignReturnType> {
        if (!this.securityGuard(callParams)) {
            return {
                success: false,
                error: "Security guard validation failed",
                signature: null,
            };
        }

        const signedData = await this.keyPair.signBytes(Uint8Array.from(data));

        return {
            success: true,
            error: null,
            signature: Array.from(signedData),
        };
    }

    /**
     * Verifies the signature. Required by aqua
     */
    verify(signature: number[], data: number[]): Promise<boolean> {
        return this.keyPair.verify(
            Uint8Array.from(data),
            Uint8Array.from(signature),
        );
    }
}
