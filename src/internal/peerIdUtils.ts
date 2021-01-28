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
import { decode, encode } from 'bs58';
import { keys } from 'libp2p-crypto';

/**
 * Converts seed string which back to peer id. Seed string can be obtained by using @see {@link peerIdToSeed} function
 * @param { string } seed - Seed to convert to peer id
 * @returns { PeerId } - Peer id
 */
export const seedToPeerId = async (seed: string): Promise<PeerId> => {
    const seedArr = decode(seed);
    const privateKey = await keys.generateKeyPairFromSeed('Ed25519', Uint8Array.from(seedArr), 256);
    return await PeerId.createFromPrivKey(privateKey.bytes);
};

/**
 * Converts peer id to a string which can be used to restore back to peer id format with. @see {@link seedToPeerId}
 * @param { PeerId } peerId - Peer id to convert to seed
 * @returns { string } - Seed string
 */
export const peerIdToSeed = (peerId: PeerId): string => {
    const seedBuf = peerId.privKey.marshal().subarray(0, 32);
    return encode(seedBuf);
};

/**
 * Generates a new peer id with random private key
 * @returns { Promise<PeerId> } - Promise with the created Peer Id
 */
export const generatePeerId = async (): Promise<PeerId> => {
    return await PeerId.create({ keyType: 'Ed25519' });
};
