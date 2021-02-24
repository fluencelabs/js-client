import {
    addBlueprint,
    addProvider,
    addScript,
    createService,
    getBlueprints,
    getInterfaces,
    getModules,
    getProviders,
    removeScript,
    uploadModule,
} from '../../internal/builtins';
import { ModuleConfig } from '../../internal/moduleConfig';
import { createConnectedClient } from '../util';
import { checkConnection } from '../../api';
import log from 'loglevel';
import { generatePeerId } from '../..';
import { FluenceClientImpl } from '../../internal/FluenceClientImpl';

const dev2multiaddr = '/dns4/dev.fluence.dev/tcp/19003/wss/p2p/12D3KooWBUJifCTgaxAUrcM9JysqCcS4CS8tiYH5hExbdWCAoNwb';
const dev3multiaddr = '/dns4/dev.fluence.dev/tcp/19004/wss/p2p/12D3KooWJbJFaZ3k5sNd8DjQgg3aERoKtBAnirEvPV8yp76kEXHB';

const dev2peerId = '12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9';

describe('Builtins usage suite', () => {
    it('get_modules', async function () {
        const client = await createConnectedClient(dev2multiaddr);

        let modulesList = await getModules(client);

        expect(modulesList).not.toBeUndefined;
    });

    it('get_interfaces', async function () {
        const client = await createConnectedClient(dev2multiaddr);

        let interfaces = await getInterfaces(client);

        expect(interfaces).not.toBeUndefined;
    });

    it('get_blueprints', async function () {
        const client = await createConnectedClient(dev2multiaddr);

        let bpList = await getBlueprints(client);

        expect(bpList).not.toBeUndefined;
    });

    it('check_connection', async function () {
        const peerId = await generatePeerId();
        const client = new FluenceClientImpl(peerId);
        await client.local();
        await client.connect(dev2multiaddr);

        let isConnected = await checkConnection(client);

        expect(isConnected).toEqual(true);
    });

    it('upload_modules', async function () {
        const client = await createConnectedClient(dev2multiaddr);

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
        const client = await createConnectedClient(dev2multiaddr);

        let bpId = 'some';

        let bpIdReturned = await addBlueprint(client, 'test_broken_blueprint', ['test_broken_module'], bpId);

        expect(bpIdReturned).toEqual(bpId);
    });

    // FIXME:: there is no error on broken blueprint from a node
    it.skip('create_service', async function () {
        const client = await createConnectedClient(dev2multiaddr);

        let serviceId = await createService(client, 'test_broken_blueprint');

        // TODO there is no error on broken blueprint from a node
        expect(serviceId).not.toBeUndefined;
    });

    it('add_provider', async function () {
        const client = await createConnectedClient(dev2multiaddr);

        let key = Math.random().toString(36).substring(7);
        let buf = Buffer.from(key);

        let r = Math.random().toString(36).substring(7);
        await addProvider(client, buf, dev2peerId, r, undefined, 10000);

        let pr = await getProviders(client, buf, undefined, 10000);
        console.log(pr);
        console.log(r);
        expect(r).toEqual(pr[0][0].service_id);
    });

    it('add and remove script', async function () {
        const client = await createConnectedClient(dev3multiaddr);

        console.log('peerid: ' + client.selfPeerId);

        let script = `
        (seq
            (call "${client.relayPeerId}" ("op" "identity") [])
            (call "${client.selfPeerId}" ("test" "test1") ["1" "2" "3"] result)
        )
    `;

        let resMakingPromise = new Promise((resolve) => {
            client.registerCallback('test', 'test1', (args, _) => {
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
