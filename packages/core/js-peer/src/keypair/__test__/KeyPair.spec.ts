import { toUint8Array } from 'js-base64';
import * as bs58 from 'bs58';
import { KeyPair } from '../index.js';

// @ts-ignore
const { decode } = bs58.default;

const key = '+cmeYlZKj+MfSa9dpHV+BmLPm6wq4inGlsPlQ1GvtPk=';
const keyBytes = toUint8Array(key);

const testData = Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 9, 10]);

const testDataSig = Uint8Array.from([
    224, 104, 245, 206, 140, 248, 27, 72, 68, 133, 111, 10, 164, 197, 242, 132, 107, 77, 224, 67, 99, 106, 76, 29, 144,
    121, 122, 169, 36, 173, 58, 80, 170, 102, 137, 253, 157, 247, 168, 87, 162, 223, 188, 214, 203, 220, 52, 246, 29,
    86, 77, 71, 224, 248, 16, 213, 254, 75, 78, 239, 243, 222, 241, 15,
]);

// signature produced by KeyPair created from some random KeyPair

describe('KeyPair tests', () => {
    it('generate keypair from seed', async function () {
        // arrange
        const random = await KeyPair.randomEd25519();
        const privateKey = random.toEd25519PrivateKey();

        // act
        const keyPair = await KeyPair.fromEd25519SK(privateKey);
        const privateKey2 = keyPair.toEd25519PrivateKey();

        // assert
        expect(privateKey).toStrictEqual(privateKey2);
    });

    it('create keypair from ed25519 private key', async function () {
        // arrange
        const rustSK = 'jDaxLJzYtzgwTMrELJCAqavtmx85ktQNfB2rLcK7MhH';
        const sk = decode(rustSK);

        // act
        const keyPair = await KeyPair.fromEd25519SK(sk);

        // assert
        const expectedPeerId = '12D3KooWH1W3VznVZ87JH4FwABK4mkntcspTVWJDta6c2xg9Pzbp';
        expect(keyPair.getPeerId()).toStrictEqual(expectedPeerId);
    });

    it('create keypair from a seed phrase', async function () {
        // arrange
        const seedArray = new Uint8Array(32).fill(1);

        // act
        const keyPair = await KeyPair.fromEd25519SK(seedArray);

        // assert
        const expectedPeerId = '12D3KooWK99VoVxNE7XzyBwXEzW7xhK7Gpv85r9F3V3fyKSUKPH5';
        expect(keyPair.getPeerId()).toStrictEqual(expectedPeerId);
    });

    it('sign', async function () {
        // arrange
        const keyPair = await KeyPair.fromEd25519SK(keyBytes);

        // act
        const res = await keyPair.signBytes(testData);

        // assert
        expect(res).toStrictEqual(testDataSig);
    });

    it('verify', async function () {
        // arrange
        const keyPair = await KeyPair.fromEd25519SK(keyBytes);

        // act
        const res = await keyPair.verify(testData, testDataSig);

        // assert
        expect(res).toBe(true);
    });

    it('sign-verify', async function () {
        // arrange
        const keyPair = await KeyPair.fromEd25519SK(keyBytes);

        // act
        const data = new Uint8Array(32).fill(1);
        const sig = await keyPair.signBytes(data);
        const res = await keyPair.verify(data, sig);

        // assert
        expect(res).toBe(true);
    });
});
