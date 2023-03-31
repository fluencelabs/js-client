import { it, describe, expect, beforeAll, afterAll } from 'vitest';

import { mkTestPeer } from '../../util/testUtils.js';
import { FluencePeer } from '../FluencePeer.js';

let peer: FluencePeer;

describe('Parse ast tests', () => {
    beforeAll(async () => {
        peer = await mkTestPeer();
        await peer.start();
    });

    afterAll(async () => {
        await peer?.stop();
    });

    it('Correct ast should be parsed correctly', async function () {
        const air = `(null)`;
        const res = await peer.internals.parseAst(air);

        expect(res).toStrictEqual({
            success: true,
            data: { Null: null },
        });
    });

    it('Incorrect ast should result in corresponding error', async function () {
        const air = `(null`;
        const res = await peer.internals.parseAst(air);

        expect(res).toStrictEqual({
            success: false,
            data: expect.stringContaining('error'),
        });
    });
});
