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
 * @returns { Promise<PeerId> } - Promise with the created Peer Id
 */
export const randomPeerId = async (): Promise<PeerId> => {
    return await PeerId.create({ keyType: 'Ed25519' });
};
