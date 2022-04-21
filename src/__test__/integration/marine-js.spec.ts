import { Fluence } from '../../index';
import fs from 'fs';
import { call } from '../_aqua/marine-js';

describe('Marine js tests', () => {
    beforeEach(async () => {
        await Fluence.start();
    });

    afterEach(async () => {
        await Fluence.stop();
    });

    it('should call marine service correctly', async () => {
        // arrange
        const wasm = fs.readFileSync(__dirname + '/greeting.wasm');
        await Fluence.registerMarineService(wasm, 'greeting');

        // act
        const res = await call('test');

        // assert
        expect(res).toBe('Hi, Hi, Hi, test');
    });
});
