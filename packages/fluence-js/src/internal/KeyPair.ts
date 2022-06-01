/*
 * Copyright 2020 Fluence Labs Limited
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

import type { PeerId } from '@libp2p/interfaces/peer-id';
import { peerIdFromBytes } from '@libp2p/peer-id';
import { keys } from 'libp2p-crypto';

type SK = keys.supportedKeys.ed25519.Ed25519PrivateKey;
export class KeyPair {
    constructor(public libp2pPeerId: PeerId, private secretKey: SK) {}

    private static async fromSk(sk: SK) {
        const lib2p2Pid = await peerIdFromBytes(sk.bytes);
        return new KeyPair(lib2p2Pid, sk);
    }

    /**
     * Generates new KeyPair from ed25519 private key represented as a 32 byte array
     * @param key - Any sequence of 32 bytes
     * @returns - Promise with the created KeyPair
     */
    static async fromEd25519SK(arr: Uint8Array): Promise<KeyPair> {
        // generateKeyPairFromSeed takes seed and copies it to private key as is
        const sk = await keys.generateKeyPairFromSeed('Ed25519', arr, 256);
        return await this.fromSk(sk);
    }

    /**
     * Generates new KeyPair with a random secret key
     * @returns - Promise with the created KeyPair
     */
    static async randomEd25519(): Promise<KeyPair> {
        const sk = await keys.generateKeyPair('Ed25519');
        return await this.fromSk(sk);
    }

    toB58String(): string {
        return this.libp2pPeerId.toString();
    }

    /**
     * @returns 32 byte private key
     */
    toEd25519PrivateKey(): Uint8Array {
        return this.secretKey.bytes;
    }

    signBytes(data: Uint8Array): Promise<Uint8Array> {
        return this.secretKey.sign(data);
    }

    verify(data: Uint8Array, signature: Uint8Array): Promise<boolean> {
        return this.secretKey.public.verify(data, signature);
    }
}
