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
import { createClient, FluenceClient } from '../../FluenceClient';
import { nodes } from '../connection';

let client: FluenceClient;

describe('Builtins usage suite', () => {
    afterEach(async () => {
        if (client) {
            await client.disconnect();
        }
    });

    jest.setTimeout(10000);

    it('get_modules', async function () {
        client = await createClient(nodes[0].multiaddr);

        let modulesList = await getModules(client);

        expect(modulesList).not.toBeUndefined;
    });

    it('get_interfaces', async function () {
        client = await createClient(nodes[0].multiaddr);

        let interfaces = await getInterfaces(client);

        expect(interfaces).not.toBeUndefined;
    });

    it('get_blueprints', async function () {
        client = await createClient(nodes[0].multiaddr);

        let bpList = await getBlueprints(client);

        expect(bpList).not.toBeUndefined;
    });

    it('upload_modules', async function () {
        client = await createClient(nodes[0].multiaddr);

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
        client = await createClient(nodes[0].multiaddr);

        let bpId = 'some';

        let bpIdReturned = await addBlueprint(client, 'test_broken_blueprint', ['test_broken_module'], bpId);
        let allBps = await getBlueprints(client);
        const allBpIds = allBps.map((x) => x.id);

        expect(allBpIds).toContain(bpIdReturned);
    });

    it('create broken blueprint', async function () {
        client = await createClient(nodes[0].multiaddr);

        let promise = createService(client, 'test_broken_blueprint');

        await expect(promise).rejects.toMatchObject({
            error: expect.stringContaining("Blueprint 'test_broken_blueprint' wasn't found"),
            instruction: expect.stringContaining('blueprint_id'),
        });
    });

    it('add and remove script', async function () {
        client = await createClient(nodes[0].multiaddr);

        let script = `
        (seq
            (call "${client.relayPeerId}" ("op" "identity") [])
            (call "${client.selfPeerId}" ("test" "test1") ["1" "2" "3"] result)
        )
    `;

        let resMakingPromise = new Promise((resolve) => {
            client.aquaCallHandler.on('test', 'test1', (args, _) => {
                resolve([...args]);
                return {};
            });
        });

        let scriptId = await addScript(client, script);

        await resMakingPromise
            .then((args) => {
                expect(args as string[]).toEqual(['1', '2', '3']);
            })
            .finally(() => {
                removeScript(client, scriptId);
            });

        expect(scriptId).not.toBeUndefined;
    });
});
