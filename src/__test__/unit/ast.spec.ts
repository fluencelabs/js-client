import { Fluence } from '../../index';

describe('Parse ast tests', () => {
    beforeAll(async () => {
        await Fluence.start();
    });

    afterAll(async () => {
        await Fluence.stop();
    });

    it('Correct ast should be parsed correctly', async function () {
        const peer = Fluence.getPeer();
        const air = `(null)`;
        const res = await peer.internals.parseAst(air);

        expect(res).toStrictEqual({
            success: true,
            data: { Null: null },
        });
    });

    it('Incorrect ast should result in corresponding error', async function () {
        const peer = Fluence.getPeer();
        const air = `(null`;
        const res = await peer.internals.parseAst(air);

        expect(res).toStrictEqual({
            success: false,
            data: expect.stringContaining('error'),
        });
    });
});
