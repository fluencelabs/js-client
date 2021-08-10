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
import { decode, encode } from 'bs58';
import { keys } from 'libp2p-crypto';

/**
 * Generates a new peer id from base64 string contatining the 32 byte Ed25519S secret key
 * @returns - Promise with the created Peer Id
 */
export const peerIdFromEd25519SK = async (sk: string): Promise<PeerId> => {
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
    return await PeerId.createFromPrivKey(protobuf);
};

/**
 * Converts peer id into base64 string contatining the 32 byte Ed25519S secret key
 * @returns - base64 of Ed25519S secret key
 */
export const peerIdToEd25519SK = (peerId: PeerId): string => {
    // export as [...private, ...public] array
    const privateAndPublicKeysArray = peerId.privKey.marshal();
    // extract the private key
    const pk = privateAndPublicKeysArray.slice(0, 32);
    // serialize private key as base64
    const b64 = base64.fromByteArray(pk);
    return b64;
};

/**
 * Generates a new peer id with random private key
 * @returns - Promise with the created Peer Id
 */
export const randomPeerId = async (): Promise<PeerId> => {
    return await PeerId.create({ keyType: 'Ed25519' });
};

/**
 * Converts seed string which back to peer id. Seed string can be obtained by using @see {@link peerIdToSeed} function
 * @param seed - Seed to convert to peer id
 * @returns - Peer id
 */
export const seedToPeerId = async (seed: string): Promise<PeerId> => {
    const seedArr = decode(seed);
    const privateKey = await keys.generateKeyPairFromSeed('Ed25519', Uint8Array.from(seedArr), 256);
    return await PeerId.createFromPrivKey(privateKey.bytes);
};

/**
 * Converts peer id to a string which can be used to restore back to peer id format with. @see {@link seedToPeerId}
 * @param peerId - Peer id to convert to seed
 * @returns - Seed string
 */
export const peerIdToSeed = (peerId: PeerId): string => {
    const seedBuf = peerId.privKey.marshal().subarray(0, 32);
    return encode(seedBuf);
};
