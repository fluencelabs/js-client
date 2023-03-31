import { it, describe, expect, beforeAll } from 'vitest';

import * as fs from 'fs';
import * as url from 'url';
import * as path from 'path';
import { compileAqua, withPeer } from '../../../__test__/util.js';

let aqua: any;
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

describe('Marine js tests', () => {
    beforeAll(async () => {
        const pathToAquaFiles = path.join(__dirname, '../../../../aqua_test/marine-js.aqua');
        const { services, functions } = await compileAqua(pathToAquaFiles);
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
