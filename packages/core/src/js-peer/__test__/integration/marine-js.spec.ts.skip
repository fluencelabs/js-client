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

    // TODO: console printouts are happening inside web-worker\worker threads.
    // Find a way to mock functions in background thread
    it.skip('logging should work', async () => {
        await withPeer(async (peer) => {
            // arrange

            jest.spyOn(global.console, 'info').mockImplementation(() => {});

            await peer.start({
                debug: {
                    marineLogLevel: 'debug',
                },
            });
            const wasm = await fs.promises.readFile(path.join(__dirname, '../data/greeting-record.wasm'));
            await peer.registerMarineService(wasm, 'greeting');

            // act
            await aqua.call_info(peer, { arg: 'greeting' });

            // assert
            expect(console.info).toBeCalledTimes(1);
            expect(console.info).toHaveBeenNthCalledWith(1, '[marine service "greeting"]: info');
        });
    });
});
