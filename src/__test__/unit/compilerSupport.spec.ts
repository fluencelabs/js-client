import { callFunction, forTests } from '../../internal/compilerSupport/v2';

describe('Compiler support tests', () => {
    it('config should work', async () => {
        // arrange
        const numArgs = 0;
        const args = [];

        // act
        const res = forTests.extractFunctionArgs(args, numArgs);

        // assert
        expect(res.config).toBe(undefined);
    });

    it('config should work2', async () => {
        // arrange
        const numArgs = 1;
        const args = [1];

        // act
        const res = forTests.extractFunctionArgs(args, numArgs);

        // assert
        expect(res.config).toBe(undefined);
    });

    it('config should work3', async () => {
        // arrange
        const numArgs = 0;
        const args = [{ ttl: 1000 }];

        // act
        const res = forTests.extractFunctionArgs(args, numArgs);

        // assert
        expect(res.config).toStrictEqual({ ttl: 1000 });
    });

    it('config should work4', async () => {
        // arrange
        const numArgs = 1;
        const args = [1, { ttl: 1000 }];

        // act
        const res = forTests.extractFunctionArgs(args, numArgs);

        // assert
        expect(res.config).toStrictEqual({ ttl: 1000 });
    });
});
