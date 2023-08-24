import { it, describe, expect } from 'vitest';

import { withPeer } from '../../util/testUtils.js';

describe('Parse ast tests', () => {
    it('Correct ast should be parsed correctly', async () => {
        withPeer(async (peer) => {
            const air = `(null)`;
            const res = await peer.internals.parseAst(air);

            expect(res).toStrictEqual({
                success: true,
                data: { Null: null },
            });
        });
    });

    it('Incorrect ast should result in corresponding error', async () => {
        withPeer(async (peer) => {
            const air = `(null`;
            const res = await peer.internals.parseAst(air);

            expect(res).toStrictEqual({
                success: false,
                data: expect.stringContaining('error'),
            });
        });
    });
});
