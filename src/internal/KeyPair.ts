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
import * as ed from 'noble-ed25519';
import { keys } from 'libp2p-crypto';
import { decode } from 'bs58';

export class KeyPair {
    /**
     * @deprecated
     * Key pair in libp2p format. Used for backward compatibility with the current FluencePeer implementation
     */
    public Libp2pPeerId: PeerId;

    constructor(libp2pPeerId: PeerId) {
        return {
            Libp2pPeerId: libp2pPeerId
        };
    }

    /**
     * Generates new KeyPair from base64 string containing the 32 byte Ed25519 private key
     * @returns - Promise with the created KeyPair
     */
    static async fromEd25519SK(base64Key: string): Promise<KeyPair> {
        // deserialize private key from base64
        const key = base64.toByteArray(base64Key);
        return await KeyPair.fromEd25519Key(key);
    }

    /**
     * Generates new KeyPair from 32 byte Ed25519 private key
     * @returns - Promise with the created KeyPair
     */
    static async fromEd25519Key(key: Uint8Array): Promise<KeyPair> {
        // calculate ed25519 public key
        const publicKey = await ed.getPublicKey(key);
        // concatenate secret + public because that's what libp2p-crypto expects
        const privateAndPublicKeysArray = new Uint8Array([...key, ...publicKey]);
        // deserialize keys.supportedKeys.Ed25519PrivateKey
        const privateKey = await keys.supportedKeys.ed25519.unmarshalEd25519PrivateKey(privateAndPublicKeysArray);
        // serialize it to protobuf encoding because that's what PeerId expects
        const protobuf = keys.marshalPrivateKey(privateKey);
        // deserialize PeerId from protobuf encoding
        const lib2p2Pid = await PeerId.createFromPrivKey(protobuf);
        return new KeyPair(lib2p2Pid);
    }

    /**
     * Generates new KeyPair from 32 byte seed
     * @returns - Promise with the created KeyPair
     */
    static async fromSeed(seed: Uint8Array): Promise<KeyPair> {
        const privateKey = await keys.generateKeyPairFromSeed('Ed25519', seed, 256);
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

    // TODO:
    // toEd25519PrivateKey(this): Uint8Array {

    // }
}
