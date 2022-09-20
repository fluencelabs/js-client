import fs from 'fs';
import path from 'path';
import { Fluence, FluencePeer } from '../../index.js';
import { call } from '../_aqua/marine-js.js';
import { call_info } from '../_aqua/marine-js-logging.js';

describe('Marine js tests', () => {
    beforeEach(async () => {
        await Fluence.start();
    });

    afterEach(async () => {
        await Fluence.stop();
    });

    it('should call marine service correctly', async () => {
        // arrange
        const wasm = await fs.promises.readFile(path.resolve() + '/wasms/greeting.wasm');
        await Fluence.registerMarineService(wasm, 'greeting');

        // act
        const res = await call('test');

        // assert
        expect(res).toBe('Hi, Hi, Hi, test');
    });

    // TODO: console printouts are happening inside web-worker\worker threads.
    // Find a way to mock functions in background thread
    it.skip('logging should work', async () => {
        // arrange
        const peer = new FluencePeer();
        try {
            jest.spyOn(global.console, 'info').mockImplementation(() => {});

            await peer.start({
                debug: {
                    marineLogLevel: 'debug',
                },
            });
            const wasm = await fs.promises.readFile(path.resolve() + '/wasms/greeting-record.wasm');
            await peer.registerMarineService(wasm, 'greeting');

            // act
            await call_info(peer, 'greeting');

            // assert
            expect(console.info).toBeCalledTimes(1);
            expect(console.info).toHaveBeenNthCalledWith(1, '[marine service "greeting"]: info');
        } finally {
            await peer.stop();
        }
    });
});
