import PeerId from 'peer-id';
import { seedToPeerId } from '../../internal/peerIdUtils';
import { RequestFlow } from '../../internal/RequestFlow';

const seed = '4vzv3mg6cnjpEK24TXXLA3Ye7QrvKWPKqfbDvAKAyLK6';
const mockDate = new Date(Date.UTC(2021, 2, 14)).valueOf();

describe('Request flow tests', () => {
    Date.now = jest.fn(() => mockDate);

    it('test1', async () => {
        // arrange
        jest.useFakeTimers();
        const request = RequestFlow.createLocal('(null)', 10000);
        const peerId = await seedToPeerId(seed);

        // act
        await request.initState(peerId);

        // assert
        const particle = request.getParticle();
        expect(particle).toMatchObject({
            init_peer_id: peerId.toB58String(),
            script: '(null)',
            signature: '5kMjU5RTjaLTJhPnngoXf98kz2CKZxNi7dv6GJDFkzBwvduaJEZmfp2VJNH58tWpL4BJSEfU2x5QFMu3EVx8GHAV',
            timestamp: mockDate,
            ttl: 10000,
        });
        expect(setTimeout).toHaveBeenCalledTimes(1);
    });
});
