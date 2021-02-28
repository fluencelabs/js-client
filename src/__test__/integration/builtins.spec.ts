import {
    addBlueprint,
    addScript,
    createService,
    getBlueprints,
    getInterfaces,
    getModules,
    removeScript,
    uploadModule,
} from '../../internal/builtins';
import { ModuleConfig } from '../../internal/moduleConfig';
import { checkConnection, createClient } from '../../api';
import { generatePeerId } from '../..';
import { FluenceClientTmp } from '../../internal/FluenceClientTmp';
import log from 'loglevel';
import { nodes } from '../connection';

describe('Builtins usage suite', () => {
    jest.setTimeout(10000);

    it('get_modules', async function () {
        const client = await createClient(nodes[0].multiaddr);

        let modulesList = await getModules(client);

        expect(modulesList).not.toBeUndefined;
    });

    it('get_interfaces', async function () {
        const client = await createClient(nodes[0].multiaddr);

        let interfaces = await getInterfaces(client);

        expect(interfaces).not.toBeUndefined;
    });

    it('get_blueprints', async function () {
        const client = await createClient(nodes[0].multiaddr);

        let bpList = await getBlueprints(client);

        expect(bpList).not.toBeUndefined;
    });

    it('upload_modules', async function () {
        const client = await createClient(nodes[0].multiaddr);

        console.log('peerid: ' + client.selfPeerId);

        let config: ModuleConfig = {
            name: 'test_broken_module',
            mem_pages_count: 100,
            logger_enabled: true,
            wasi: {
                envs: { a: 'b' },
                preopened_files: ['a', 'b'],
                mapped_dirs: { c: 'd' },
            },
            mounted_binaries: { e: 'f' },
        };

        let base64 = 'MjNy';

        await uploadModule(client, 'test_broken_module', base64, config, 10000);
    });

    it('add_blueprint', async function () {
        const client = await createClient(nodes[0].multiaddr);

        let bpId = 'some';

        let bpIdReturned = await addBlueprint(client, 'test_broken_blueprint', ['test_broken_module'], bpId);

        expect(bpIdReturned).toEqual(bpId);
    });

    // FIXME:: there is no error on broken blueprint from a node
    it.skip('create_service', async function () {
        const client = await createClient(nodes[0].multiaddr);

        let serviceId = await createService(client, 'test_broken_blueprint');

        // TODO there is no error on broken blueprint from a node
        expect(serviceId).not.toBeUndefined;
    });

    it('add and remove script', async function () {
        const client = await createClient(nodes[0].multiaddr);

        console.log('peerid: ' + client.selfPeerId);

        let script = `
        (seq
            (call "${client.relayPeerId}" ("op" "identity") [])
            (call "${client.selfPeerId}" ("test" "test1") ["1" "2" "3"] result)
        )
    `;

        let resMakingPromise = new Promise((resolve) => {
            client.handler.on('test', 'test1', (args, _) => {
                resolve([...args]);
                return {};
            });
        });

        let scriptId = await addScript(client, script);

        await resMakingPromise
            .then((args) => {
                console.log('final!');
                expect(args as string[]).toEqual(['1', '2', '3']);
            })
            .finally(() => {
                removeScript(client, scriptId);
            });

        expect(scriptId).not.toBeUndefined;
    });
});
