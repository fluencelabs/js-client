import { encode } from 'bs58';
import { peerIdFromEd25519SK, peerIdToEd25519SK, randomPeerId } from '../../internal/peerIdUtils';

describe('Peer Id utils', () => {
    it('should create private key from seed and back', async function () {
        // arrange
        const sk = 'z1x3cVXhk9nJKE1pZaX9KxccUBzxu3aGlaUjDdAB2oY=';

        // act
        const pid = await peerIdFromEd25519SK(sk);
        const sk2 = peerIdToEd25519SK(pid);

        // assert
        expect(sk2).toBe(sk);
    });
});
