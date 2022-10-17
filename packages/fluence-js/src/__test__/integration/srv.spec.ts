import { Fluence, FluencePeer, KeyPair, setLogLevel } from '../../index';

import fs from 'fs/promises';
import path from 'path';
import { happy_path, service_removed } from '../_aqua/srv-tests';

let peer: FluencePeer;

describe('Srv service test suite', () => {
    afterEach(async () => {
        if (peer) {
            await peer.stop();
        }
    });

    beforeEach(async () => {
        peer = new FluencePeer();
        await peer.start();
    });

    it('Use custom srv service, success path', async () => {
        // arrange
        const wasm = path.join(__dirname, './greeting.wasm');

        // act
        const res = await happy_path(peer, wasm);

        // assert
        expect(res).toBe('Hi, test');
    });

    it('Use custom srv service, success path', async () => {
        // arrange
        const wasm = path.join(__dirname, './greeting.wasm');

        // act
        const res = await service_removed(peer, wasm);

        // assert
        expect(res).toBe('Hi, test');
    });
});
