import path from 'path';
import { compileAqua, withPeer, getDataFile } from '../util';

let aqua: any;

describe('Srv service test suite', () => {
    beforeAll(async () => {
        const { services, functions } = await compileAqua(getDataFile('./srv.aqua'));
        aqua = functions;
    });

    it('Use custom srv service, success path', async () => {
        await withPeer(async (peer) => {
            // arrange
            const wasm = getDataFile('./greeting.wasm');

            // act
            const res = await aqua.happy_path(peer, { file_path: wasm });

            // assert
            expect(res).toBe('Hi, test');
        });
    });

    it('List deployed services', async () => {
        await withPeer(async (peer) => {
            // arrange
            const wasm = getDataFile('./greeting.wasm');

            // act
            const res = await aqua.list_services(peer, { file_path: wasm });

            // assert
            expect(res).toHaveLength(3);
        });
    });

    it('Correct error for removed services', async () => {
        await withPeer(async (peer) => {
            // arrange
            const wasm = getDataFile('./greeting.wasm');

            // act
            const res = await aqua.service_removed(peer, { file_path: wasm });

            // assert
            expect(res).toMatch('No handler has been registered for serviceId');
        });
    });

    it('Correct error for file not found', async () => {
        await withPeer(async (peer) => {
            // arrange

            // act
            const res = await aqua.file_not_found(peer, {});

            // assert
            expect(res).toMatch("ENOENT: no such file or directory, open '/random/incorrect/file'");
        });
    });

    it('Correct error for removing non existing service', async () => {
        await withPeer(async (peer) => {
            // arrange

            // act
            const res = await aqua.removing_non_exiting(peer, {});

            // assert
            expect(res).toMatch('Service with id random_id not found');
        });
    });
});
