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

import { KeyPairOptions } from "@fluencelabs/interfaces";
import { generateKeyPairFromSeed, generateKeyPair } from "@libp2p/crypto/keys";
import type { PrivateKey, PublicKey } from "@libp2p/interface/keys";
import type { PeerId } from "@libp2p/interface/peer-id";
import { createFromPrivKey } from "@libp2p/peer-id-factory";
import { decode } from "bs58";
import { toUint8Array } from "js-base64";

export class KeyPair {
    /**
     * Key pair in libp2p format. Used for backward compatibility with the current FluencePeer implementation
     */
    getLibp2pPeerId() {
        return this.libp2pPeerId;
    }

    constructor(
        private privateKey: PrivateKey | undefined,
        private publicKey: PublicKey,
        private libp2pPeerId: PeerId,
    ) {}

    /**
     * Generates new KeyPair from ed25519 private key represented as a 32 byte array
     * @param seed - Any sequence of 32 bytes
     * @returns - Promise with the created KeyPair
     */
    static async fromEd25519SK(seed: Uint8Array): Promise<KeyPair> {
        const key = await generateKeyPairFromSeed("Ed25519", seed, 256);
        const lib2p2Pid = await createFromPrivKey(key);
        return new KeyPair(key, key.public, lib2p2Pid);
    }

    /**
     * Generates new KeyPair with a random secret key
     * @returns - Promise with the created KeyPair
     */
    static async randomEd25519(): Promise<KeyPair> {
        const key = await generateKeyPair("Ed25519");
        const lib2p2Pid = await createFromPrivKey(key);
        return new KeyPair(key, key.public, lib2p2Pid);
    }

    getPeerId(): string {
        return this.libp2pPeerId.toString();
    }

    /**
     * @returns 32 byte private key
     */
    toEd25519PrivateKey(): Uint8Array {
        if (this.privateKey === undefined) {
            throw new Error("Private key not supplied");
        }

        return this.privateKey.marshal().subarray(0, 32);
    }

    signBytes(data: Uint8Array): Promise<Uint8Array> {
        if (this.privateKey === undefined) {
            throw new Error("Private key not supplied");
        }

        return this.privateKey.sign(data);
    }

    verify(data: Uint8Array, signature: Uint8Array): Promise<boolean> {
        return this.publicKey.verify(data, signature);
    }
}

export const fromBase64Sk = (sk: string): Promise<KeyPair> => {
    const skArr = toUint8Array(sk);
    return KeyPair.fromEd25519SK(skArr);
};

export const fromBase58Sk = (sk: string): Promise<KeyPair> => {
    const skArr = decode(sk);
    return KeyPair.fromEd25519SK(skArr);
};

export const fromOpts = (opts: KeyPairOptions): Promise<KeyPair> => {
    if (opts.source === "random") {
        return KeyPair.randomEd25519();
    }

    return KeyPair.fromEd25519SK(opts.source);
};
