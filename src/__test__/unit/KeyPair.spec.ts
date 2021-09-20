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
