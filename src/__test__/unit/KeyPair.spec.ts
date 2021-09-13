import * as bs58 from 'bs58';
import * as base64 from 'base64-js';
import { KeyPair } from '../../internal/KeyPair';

describe('KeyPair tests', () => {
    it('should create private key from seed and back', async function () {
        // arrange
        const sk = 'z1x3cVXhk9nJKE1pZaX9KxccUBzxu3aGlaUjDdAB2oY=';

        // act
        const keyPair = await KeyPair.fromEd25519SK(sk);
        const privateKey = keyPair.toEd25519PrivateKey();
        const sk2 = base64.fromByteArray(privateKey)

        // assert
        expect(sk2).toBe(sk);
    });

    it('generate keypair from seed', async function () {
        // arrange
        const random = await KeyPair.randomEd25519();
        const privateKey = random.toEd25519PrivateKey();

        // act
        const keyPair = await KeyPair.fromArray(privateKey);
        const privateKey2 = keyPair.toEd25519PrivateKey();

        // assert
        expect(privateKey).toStrictEqual(privateKey2);
    });

    it('create keypair from ed25519 private key', async function() {
        // arrange
        const rustSK = "jDaxLJzYtzgwTMrELJCAqavtmx85ktQNfB2rLcK7MhH";
        const sk = bs58.decode(rustSK);

        // act
        const keyPair = await KeyPair.fromArray(sk);

        // assert
        const expectedPeerId = "12D3KooWH1W3VznVZ87JH4FwABK4mkntcspTVWJDta6c2xg9Pzbp";
        expect(keyPair.Libp2pPeerId.toB58String()).toStrictEqual(expectedPeerId);
    });

    it('create keypair from a seed phrase', async function() {
        // arrange
        const seedArray = new Uint8Array(32).fill(1);
        
        // act
        const keyPair = await KeyPair.fromArray(seedArray);

        // assert
        const expectedPeerId = "12D3KooWK99VoVxNE7XzyBwXEzW7xhK7Gpv85r9F3V3fyKSUKPH5";
        expect(keyPair.Libp2pPeerId.toB58String()).toStrictEqual(expectedPeerId);
    });
});
