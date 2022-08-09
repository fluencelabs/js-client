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

import * as PeerId from 'peer-id';
import { keys } from 'libp2p-crypto';
import { toUint8Array } from 'js-base64';

export class KeyPair {
    /**
     * Key pair in libp2p format. Used for backward compatibility with the current FluencePeer implementation
     */
    public Libp2pPeerId: PeerId;

    constructor(libp2pPeerId: PeerId) {
        this.Libp2pPeerId = libp2pPeerId;
    }

    /**
     * Generates new KeyPair from ed25519 private key represented as a 32 byte array
     * @param key - Any sequence of 32 bytes
     * @returns - Promise with the created KeyPair
     */
    static async fromEd25519SK(arr: Uint8Array): Promise<KeyPair> {
        // generateKeyPairFromSeed takes seed and copies it to private key as is
        const privateKey = await keys.generateKeyPairFromSeed('Ed25519', arr, 256);
        const lib2p2Pid = await PeerId.createFromPrivKey(privateKey.bytes);
        return new KeyPair(lib2p2Pid);
    }

    /**
     * Generates new KeyPair with a random secret key
     * @returns - Promise with the created KeyPair
     */
    static async randomEd25519(): Promise<KeyPair> {
        const lib2p2Pid = await PeerId.create({ keyType: 'Ed25519' });
        return new KeyPair(lib2p2Pid);
    }

    toB58String(): string {
        return this.Libp2pPeerId.toB58String();
    }

    /**
     * @returns 32 byte private key
     */
    toEd25519PrivateKey(): Uint8Array {
        return this.Libp2pPeerId.privKey.marshal().subarray(0, 32);
    }

    signBytes(data: Uint8Array): Promise<Uint8Array> {
        return this.Libp2pPeerId.privKey.sign(data);
    }

    verify(data: Uint8Array, signature: Uint8Array): Promise<boolean> {
        return this.Libp2pPeerId.privKey.public.verify(data, signature);
    }
}

export const keyPairFromBase64Sk = (sk: string): Promise<KeyPair> => {
    const arr = toUint8Array(sk);
    return KeyPair.fromEd25519SK(arr);
};
