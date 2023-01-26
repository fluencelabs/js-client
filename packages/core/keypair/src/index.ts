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

import type { PeerId } from '@libp2p/interface-peer-id';
import { peerIdFromBytes } from '@libp2p/peer-id';
import { createEd25519PeerId } from '@libp2p/peer-id-factory';

export class KeyPair {
    /**
     * Key pair in libp2p format. Used for backward compatibility with the current FluencePeer implementation
     */
    getLibp2pPeerId() {
        return this.libp2pPeerId;
    }

    constructor(private libp2pPeerId: PeerId) {}

    /**
     * Generates new KeyPair from ed25519 private key represented as a 32 byte array
     * @param key - Any sequence of 32 bytes
     * @returns - Promise with the created KeyPair
     */
    static async fromEd25519SK(arr: Uint8Array): Promise<KeyPair> {
        const lib2p2Pid = peerIdFromBytes(arr);
        return new KeyPair(lib2p2Pid);
    }

    /**
     * Generates new KeyPair with a random secret key
     * @returns - Promise with the created KeyPair
     */
    static async randomEd25519(): Promise<KeyPair> {
        const lib2p2Pid = await createEd25519PeerId();
        return new KeyPair(lib2p2Pid);
    }

    getPeerId(): string {
        return this.libp2pPeerId.toString();
    }

    /**
     * @returns 32 byte private key
     */
    toEd25519PrivateKey(): Uint8Array {
        return this.libp2pPeerId.privateKey!.subarray(0, 32);
    }

    signBytes(data: Uint8Array): Promise<Uint8Array> {
        throw new Error('not implemented');
        // return this.libp2pPeerId.sign(data);
    }

    verify(data: Uint8Array, signature: Uint8Array): Promise<boolean> {
        throw new Error('not implemented');
        // return this.libp2pPeerId.verify(data, signature);
    }
}
