import { it, describe, expect, beforeAll } from 'vitest';

import * as fs from 'fs';
import * as url from 'url';
import * as path from 'path';
import { compileAqua, withPeer } from '../util.js';

let aqua: any;
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

describe('Marine js tests', () => {
    beforeAll(async () => {
        const { services, functions } = await compileAqua(path.join(__dirname, '../data/marine-js.aqua'));
        aqua = functions;
    });

    it('should call marine service correctly', async () => {
        await withPeer(async (peer) => {
            // arrange
            const wasm = await fs.promises.readFile(path.join(__dirname, '../data/greeting.wasm'));
            await peer.registerMarineService(wasm, 'greeting');

            // act
            const res = await aqua.call(peer, { arg: 'test' });

            // assert
            expect(res).toBe('Hi, Hi, Hi, test');
        });
    });
});
