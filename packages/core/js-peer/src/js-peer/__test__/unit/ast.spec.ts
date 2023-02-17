import {createClient} from "../../../../../../client/js-client.node";

describe('Parse ast tests', () => {

    let somePeer: any;
    
    beforeAll(async () => {
        somePeer = await createClient();
        await somePeer.start();
    }, 10000);

    afterAll(async () => {
        await somePeer.stop();
    });

    it('Correct ast should be parsed correctly', async function () {
        const air = `(null)`;
        const res = await somePeer.internals.parseAst(air);

        expect(res).toStrictEqual({
            success: true,
            data: { Null: null },
        });
    });

    it('Incorrect ast should result in corresponding error', async function () {
        const air = `(null`;
        const res = await somePeer.internals.parseAst(air);

        expect(res).toStrictEqual({
            success: false,
            data: expect.stringContaining('error'),
        });
    });
});
