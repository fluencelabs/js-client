import { Fluence } from '../../index';
import fs from 'fs';
import { call } from '../_aqua/marine-js';

describe('Marine js tests', () => {
    it('should call marine service correctly', async () => {
        // arrange
        await Fluence.start();

        // act
        const wasm = fs.readFileSync(__dirname + '/greeting.wasm');
        await Fluence.registerMarineService(wasm, 'greeting');
        const res = await call('test');

        // assert
        expect(res).toBe('Hi, Hi, Hi, test');
    });
});
