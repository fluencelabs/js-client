import { seedToPeerId } from '../../internal/peerIdUtils';
import { RequestFlow } from '../../internal/RequestFlow';

describe('Request flow tests', () => {
    it('particle initiation should work', async () => {
        // arrange
        jest.useFakeTimers();
        const seed = '4vzv3mg6cnjpEK24TXXLA3Ye7QrvKWPKqfbDvAKAyLK6';
        const mockDate = new Date(Date.UTC(2021, 2, 14)).valueOf();
        Date.now = jest.fn(() => mockDate);

        const request = RequestFlow.createLocal('(null)', 10000);
        const peerId = await seedToPeerId(seed);

        // act
        await request.initState(peerId);

        // assert
        const particle = request.getParticle();
        expect(particle).toMatchObject({
            init_peer_id: peerId.toB58String(),
            script: '(null)',
            signature: '',
            timestamp: mockDate,
            ttl: 10000,
        });
        expect(setTimeout).toHaveBeenCalledTimes(1);
    });
});
