import { encode } from 'bs58';
import { peerIdToSeed, seedToPeerId } from '../..';

describe('Handler for builtins', () => {
    it('should create private key from seed and back', async function () {
        // prettier-ignore
        let seed = [46, 188, 245, 171, 145, 73, 40, 24, 52, 233, 215, 163, 54, 26, 31, 221, 159, 179, 126, 106, 27, 199, 189, 194, 80, 133, 235, 42, 42, 247, 80, 201];
        let seedStr = encode(seed);

        let pid = await seedToPeerId(seedStr);
        expect(peerIdToSeed(pid)).toEqual(seedStr);
    });
});
