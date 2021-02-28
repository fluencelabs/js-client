import PeerId from 'peer-id';
import { verifyParticle } from '../../internal/particle';
import { seedToPeerId } from '../../internal/peerIdUtils';
import { RequestFlow } from '../../internal/RequestFlow';

const seed = '4vzv3mg6cnjpEK24TXXLA3Ye7QrvKWPKqfbDvAKAyLK6';
const mockDate = new Date(Date.UTC(2021, 2, 14)).valueOf();

describe('Request flow tests', () => {
    Date.now = jest.fn(() => mockDate);

    it('particle initiation should work', async () => {
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
            timestamp: mockDate,
            ttl: 10000,
        });
        expect(await verifyParticle(peerId, particle)).toBeTruthy();
        expect(setTimeout).toHaveBeenCalledTimes(1);
    });
});
