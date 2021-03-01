import PeerId from 'peer-id';
import { genUUID } from '../../internal/particle';
import { seedToPeerId } from '../../internal/peerIdUtils';
import { RequestFlow } from '../../internal/RequestFlow';

describe('Request flow tests', () => {
    it('particle initiation should work', async () => {
        // arrange
        jest.useFakeTimers();
        const seed = '4vzv3mg6cnjpEK24TXXLA3Ye7QrvKWPKqfbDvAKAyLK6';
        const mockDate = new Date(Date.UTC(2021, 2, 14)).valueOf();
        Date.now = jest.fn(() => mockDate);

        const request = new RequestFlow(false, '9986a562-7a66-11eb-9439-0242ac130002', '(null)');
        request.ttl = 10000;
        const peerId = await seedToPeerId(seed);

        // act
        await request.initState(peerId);

        // assert
        const particle = request.getParticle();
        expect(particle).toMatchObject({
            id: '9986a562-7a66-11eb-9439-0242ac130002',
            init_peer_id: peerId.toB58String(),
            script: '(null)',
            signature: '441A5VjNQN3Bq1KhuQZjsxpYt8xhkC453H3v5QCiQLJkxf48dnJpzk86MxfhT13ZUVs27GC8Q7yLLVTR2NFBE56g',
            timestamp: mockDate,
            ttl: 10000,
        });
        expect(setTimeout).toHaveBeenCalledTimes(1);
    });
});
