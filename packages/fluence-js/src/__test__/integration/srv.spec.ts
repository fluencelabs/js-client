import path from 'path';
import { happy_path, service_removed, file_not_found, list_services, removing_non_exiting } from '../_aqua/srv-tests';
import { makeDefaultPeer, FluencePeer } from '../../internal/FluencePeer';

let peer: FluencePeer;

describe('Srv service test suite', () => {
    afterEach(async () => {
        if (peer) {
            await peer.stop();
        }
    });

    beforeEach(async () => {
        peer = makeDefaultPeer();
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

    it('List deployed services', async () => {
        // arrange
        const wasm = path.join(__dirname, './greeting.wasm');

        // act
        const res = await list_services(peer, wasm);

        // assert
        expect(res).toHaveLength(3);
    });

    it('Correct error for removed services', async () => {
        // arrange
        const wasm = path.join(__dirname, './greeting.wasm');

        // act
        const res = await service_removed(peer, wasm);

        // assert
        expect(res).toMatch('No handler has been registered for serviceId');
    });

    it('Correct error for file not found', async () => {
        // arrange

        // act
        const res = await file_not_found(peer);

        // assert
        expect(res).toMatch("ENOENT: no such file or directory, open '/random/incorrect/file'");
    });

    it('Correct error for removing non existing service', async () => {
        // arrange

        // act
        const res = await removing_non_exiting(peer);

        // assert
        expect(res).toMatch('Service with id random_id not found');
    });
});
