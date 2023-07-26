import { it, describe, expect, beforeAll } from 'vitest';
import * as path from 'path';
import * as url from 'url';
import { compileAqua, withPeer } from '../../util/testUtils.js';
import { registerNodeUtils } from '../_aqua/node-utils.js';
import { NodeUtils } from '../NodeUtils.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
let aqua: any;

describe('Srv service test suite', () => {
    beforeAll(async () => {
        const pathToAquaFiles = path.join(__dirname, '../../../aqua_test/srv.aqua');
        const { services, functions } = await compileAqua(pathToAquaFiles);
        aqua = functions;
    });

    it('Use custom srv service, success path', async () => {
        await withPeer(async (peer) => {
            // arrange
            registerNodeUtils(peer, 'node_utils', new NodeUtils(peer));
            const wasm = path.join(__dirname, '../../../data_for_test/greeting.wasm');

            // act
            const res = await aqua.happy_path(peer, { file_path: wasm });

            // assert
            expect(res).toBe('Hi, test');
        });
    }, 10000);

    it('List deployed services', async () => {
        await withPeer(async (peer) => {
            // arrange
            registerNodeUtils(peer, 'node_utils', new NodeUtils(peer));
            const wasm = path.join(__dirname, '../../../data_for_test/greeting.wasm');

            // act
            const res = await aqua.list_services(peer, { file_path: wasm });

            // assert
            expect(res).toHaveLength(3);
        });
    }, 10000);

    it('Correct error for removed services', async () => {
        await withPeer(async (peer) => {
            // arrange
            registerNodeUtils(peer, 'node_utils', new NodeUtils(peer));
            const wasm = path.join(__dirname, '../../../data_for_test/greeting.wasm');

            // act
            const res = await aqua.service_removed(peer, { file_path: wasm });

            // assert
            expect(res).toMatch('No service found for service call');
        });
    }, 10000);

    it('Correct error for file not found', async () => {
        await withPeer(async (peer) => {
            // arrange
            registerNodeUtils(peer, 'node_utils', new NodeUtils(peer));

            // act
            const res = await aqua.file_not_found(peer, {});

            // assert
            expect(res).toMatch("ENOENT: no such file or directory, open '/random/incorrect/file'");
        });
    }, 10000);

    it('Correct error for removing non existing service', async () => {
        await withPeer(async (peer) => {
            // arrange
            registerNodeUtils(peer, 'node_utils', new NodeUtils(peer));

            // act
            const res = await aqua.removing_non_exiting(peer, {});

            // assert
            expect(res).toMatch('Service with id random_id not found');
        });
    }, 10000);
});
