import fs from 'fs';
import path from 'path';
import { makeDefaultPeer, FluencePeer } from '../../internal/FluencePeer';
import { compileAqua } from '../util';

let peer: FluencePeer;
let aqua: any;

describe('Marine js tests', () => {
    beforeAll(async () => {
        const { services, functions } = await compileAqua(path.join(__dirname, './marine-js.aqua'));
        aqua = functions;
    });

    beforeEach(async () => {
        const peer = makeDefaultPeer();
        await peer.start();
    });

    afterEach(async () => {
        if (peer) {
            await peer.stop();
        }
    });

    it('should call marine service correctly', async () => {
        // arrange
        const wasm = await fs.promises.readFile(__dirname + '/greeting.wasm');
        await peer.registerMarineService(wasm, 'greeting');

        // act
        const res = await aqua.call(peer, { arg: 'test' });

        // assert
        expect(res).toBe('Hi, Hi, Hi, test');
    });

    // TODO: console printouts are happening inside web-worker\worker threads.
    // Find a way to mock functions in background thread
    it.skip('logging should work', async () => {
        // arrange
        const peer = makeDefaultPeer();
        try {
            jest.spyOn(global.console, 'info').mockImplementation(() => {});

            await peer.start({
                debug: {
                    marineLogLevel: 'debug',
                },
            });
            const wasm = await fs.promises.readFile(__dirname + '/greeting-record.wasm');
            await peer.registerMarineService(wasm, 'greeting');

            // act
            await aqua.call_info(peer, { arg: 'greeting' });

            // assert
            expect(console.info).toBeCalledTimes(1);
            expect(console.info).toHaveBeenNthCalledWith(1, '[marine service "greeting"]: info');
        } finally {
            await peer.stop();
        }
    });
});
