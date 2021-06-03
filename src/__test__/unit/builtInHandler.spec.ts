import { encode } from 'bs58';
import { peerIdToSeed, seedToPeerId } from '../..';
import { CallServiceData } from '../../internal/CallServiceHandler';
import makeDefaultClientHandler from '../../internal/defaultClientHandler';

const handler = makeDefaultClientHandler();

const mkReq = (fnName: string, args: unknown[]) => {
    return {
        serviceId: 'Op',
        fnName: fnName,
        args: args,
        tetraplets: [],
        particleContext: {
            particleId: 'some',
        },
    };
};

describe('Handler for builtins', () => {
    it('1', () => {
        // arrange
        const req: CallServiceData = mkReq('identity', []);

        // act
        const res = handler.execute(req);

        // assert
        expect(res).toMatchObject({
            retCode: 0,
            result: {},
        });
    });
});
