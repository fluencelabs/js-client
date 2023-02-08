import { FluencePeer } from '@fluencelabs/js-peer/dist/js-peer/FluencePeer.js';
import { MarineBasedAvmRunner } from '@fluencelabs/js-peer/dist/js-peer/avm.js';
import { MarineBackgroundRunner } from '@fluencelabs/js-peer/dist/marine/worker';
import { marineLogFunction } from '@fluencelabs/js-peer/dist/js-peer/utils.js';
import { WasmLoaderFromNpm } from '@fluencelabs/js-peer/dist/marine/deps-loader/node.js';
import { WorkerLoader } from '@fluencelabs/js-peer/dist/marine/worker-script/workerLoader.js';

export const defaultNames = {
    avm: {
        file: 'avm.wasm',
        package: '@fluencelabs/avm',
    },
    marine: {
        file: 'marine-js.wasm',
        package: '@fluencelabs/marine-js',
    },
};

export const makeDefaultPeer = () => {
    const workerLoader = new WorkerLoader();
    const controlModuleLoader = new WasmLoaderFromNpm(defaultNames.marine.package, defaultNames.marine.file);
    const avmModuleLoader = new WasmLoaderFromNpm(defaultNames.avm.package, defaultNames.avm.file);

    const marine = new MarineBackgroundRunner(workerLoader, controlModuleLoader, marineLogFunction);
    const avm = new MarineBasedAvmRunner(marine, avmModuleLoader, undefined);
    return new FluencePeer(marine, avm);
};

// @ts-ignore
globalThis.defaultPeer = makeDefaultPeer();
