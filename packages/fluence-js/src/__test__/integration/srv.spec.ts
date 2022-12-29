import path from 'path';
import { makeDefaultPeer, FluencePeer } from '../../internal/FluencePeer';
import { compileAqua } from '../util';

let peer: FluencePeer;
let aqua: any;

describe('Srv service test suite', () => {
    beforeAll(async () => {
        const { services, functions } = await compileAqua(path.join(__dirname, './srv.aqua'));
        aqua = functions;
    });

    beforeEach(async () => {
        peer = makeDefaultPeer();
        await peer.start();
    });

    afterEach(async () => {
        if (peer) {
            await peer.stop();
        }
    });

    it('Use custom srv service, success path', async () => {
        // arrange
        const wasm = path.join(__dirname, './greeting.wasm');

        // act
        const res = await aqua.happy_path(peer, { file_path: wasm });

        // assert
        expect(res).toBe('Hi, test');
    });

    it('List deployed services', async () => {
        // arrange
        const wasm = path.join(__dirname, './greeting.wasm');

        // act
        const res = await aqua.list_services(peer, { file_path: wasm });

        // assert
        expect(res).toHaveLength(3);
    });

    it('Correct error for removed services', async () => {
        // arrange
        const wasm = path.join(__dirname, './greeting.wasm');

        // act
        const res = await aqua.service_removed(peer, { file_path: wasm });

        // assert
        expect(res).toMatch('No handler has been registered for serviceId');
    });

    it('Correct error for file not found', async () => {
        // arrange

        // act
        const res = await aqua.file_not_found(peer, {});

        // assert
        expect(res).toMatch("ENOENT: no such file or directory, open '/random/incorrect/file'");
    });

    it('Correct error for removing non existing service', async () => {
        // arrange

        // act
        const res = await aqua.removing_non_exiting(peer, {});

        // assert
        expect(res).toMatch('Service with id random_id not found');
    });
});
