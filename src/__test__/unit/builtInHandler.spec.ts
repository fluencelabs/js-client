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

    it('2', () => {
        // arrange
        const req: CallServiceData = mkReq('identity', [1]);

        // act
        const res = handler.execute(req);

        // assert
        expect(res).toMatchObject({
            retCode: 0,
            result: 1,
        });
    });

    it('3', () => {
        // arrange
        const req: CallServiceData = mkReq('identity', [1, 2]);

        // act
        const res = handler.execute(req);

        // assert
        expect(res).toMatchObject({
            retCode: 1,
            result: 'identity accepts up to 1 arguments, received 2 arguments',
        });
    });

    it('5', () => {
        // arrange
        const req: CallServiceData = mkReq('noop', [1, 2]);

        // act
        const res = handler.execute(req);

        // assert
        expect(res).toMatchObject({
            retCode: 0,
            result: {},
        });
    });

    it('512', () => {
        // arrange
        const req: CallServiceData = mkReq('array', [1, 2, 3]);

        // act
        const res = handler.execute(req);

        // assert
        expect(res).toMatchObject({
            retCode: 0,
            result: [1, 2, 3],
        });
    });

    it('51211', () => {
        // arrange
        const req: CallServiceData = mkReq('concat', [
            [1, 2],
            [3, 4],
            [5, 6],
        ]);

        // act
        const res = handler.execute(req);

        // assert
        expect(res).toMatchObject({
            retCode: 0,
            result: [1, 2, 3, 4, 5, 6],
        });
    });

    it('5121115125', () => {
        // arrange
        const req: CallServiceData = mkReq('concat', []);

        // act
        const res = handler.execute(req);

        // assert
        expect(res).toMatchObject({
            retCode: 0,
            result: [],
        });
    });

    it('5121122', () => {
        // arrange
        const req: CallServiceData = mkReq('concat', [[1, 2]]);

        // act
        const res = handler.execute(req);

        // assert
        expect(res).toMatchObject({
            retCode: 0,
            result: [1, 2],
        });
    });

    it('512112222', () => {
        // arrange
        const req: CallServiceData = mkReq('concat', [1, [1, 2], 1]);

        // act
        const res = handler.execute(req);

        // assert
        expect(res).toMatchObject({
            retCode: 1,
            result: "All arguments of 'concat' must be arrays: arguments 0, 2 are not",
        });
    });
});
