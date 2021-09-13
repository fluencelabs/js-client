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
import * as base64 from 'base64-js';
import { keys } from 'libp2p-crypto';

export class KeyPair {
    /**
     * Key pair in libp2p format. Used for backward compatibility with the current FluencePeer implementation
     */
    public Libp2pPeerId: PeerId;

    constructor(libp2pPeerId: PeerId) {        
        this.Libp2pPeerId = libp2pPeerId
    }

    /**
     * Generates new KeyPair from base64 string containing the 32 byte Ed25519 private key
     * @returns - Promise with the created KeyPair
     */
    // static async fromEd25519SK(base64Key: string): Promise<KeyPair> {
    //     // deserialize private key from base64
    //     const key = base64.toByteArray(base64Key);
    //     return await KeyPair.fromBytes(key);
    // }

    static async fromEd25519SK(sk: string): Promise<KeyPair> {
        // deserialize secret key from base64
        const bytes = base64.toByteArray(sk);
        // calculate ed25519 public key
        const publicKey = await ed.getPublicKey(bytes);
        // concatenate secret + public because that's what libp2p-crypto expects
        const privateAndPublicKeysArray = new Uint8Array([...bytes, ...publicKey]);
        // deserialize keys.supportedKeys.Ed25519PrivateKey
        const privateKey = await keys.supportedKeys.ed25519.unmarshalEd25519PrivateKey(privateAndPublicKeysArray);
        // serialize it to protobuf encoding because that's what PeerId expects
        const protobuf = keys.marshalPrivateKey(privateKey);
        // deserialize PeerId from protobuf encoding
        const lib2p2Pid = await PeerId.createFromPrivKey(protobuf);
        return new KeyPair(lib2p2Pid);
    }

    /**
     * Generates new KeyPair from a 32 byte array
     * @param key - Any sequence of 32 bytes
     * @returns - Promise with the created KeyPair
     */
    static async fromBytes(arr: Uint8Array): Promise<KeyPair> {
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

    /**
     * @returns 32 byte private key
     */
    toEd25519PrivateKey(): Uint8Array {
        return this.Libp2pPeerId.privKey.marshal().subarray(0, 32);
    }
}
