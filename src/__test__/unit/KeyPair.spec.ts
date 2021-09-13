import { encode } from 'bs58';
import * as base64 from 'base64-js';
import PeerId from 'peer-id';
import { KeyPair } from '../../internal/KeyPair';

describe('KeyPair tests', () => {
    it('should create private key from seed and back', async function () {
        // arrange
        const sk = 'z1x3cVXhk9nJKE1pZaX9KxccUBzxu3aGlaUjDdAB2oY=';

        // act
        const keyPair = await KeyPair.fromEd25519SK(sk);
        const sk2 = peerIdToEd25519SK(keyPair.Libp2pPeerId);

        // assert
        expect(sk2).toBe(sk);
    });

    it('generate keypair from seed', async function () {
        // arrange
        const random = await KeyPair.randomEd25519();
        const seed = peerIdToSeed(random.Libp2pPeerId);

        // act
        const keyPair = await KeyPair.fromSeed(seed);
        const seed2 = peerIdToSeed(keyPair.Libp2pPeerId);

        // assert
        expect(seed).toStrictEqual(seed2);
    });

    // it('create keypair from ed25519 private key', async function() {
        
    // });
});

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
 * Converts peer id to a string which can be used to restore back to peer id format with. @see {@link seedToPeerId}
 * @param { PeerId } peerId - Peer id to convert to seed
 * @returns { string } - Seed string
 */
export const peerIdToSeed = (peerId: PeerId): Uint8Array => {
    return peerId.privKey.marshal().subarray(0, 32);
};
