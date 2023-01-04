import { MarineBackgroundRunner } from '@fluencelabs/marine.background-runner';
import { MarineBasedAvmRunner } from '@fluencelabs/js-peer/dist/avm';
import { marineLogFunction } from '@fluencelabs/js-peer/dist/utils';
import { FluencePeer } from '@fluencelabs/js-peer/dist/FluencePeer';
import { InlinedWorkerLoader, WasmNpmLoader } from '@fluencelabs/marine.deps-loader.node';

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
    const workerLoader = new InlinedWorkerLoader();
    const controlModuleLoader = new WasmNpmLoader(defaultNames.marine.package, defaultNames.marine.file);
    const avmModuleLoader = new WasmNpmLoader(defaultNames.avm.package, defaultNames.avm.file);

    const marine = new MarineBackgroundRunner(workerLoader, controlModuleLoader, marineLogFunction);
    const avm = new MarineBasedAvmRunner(marine, avmModuleLoader, undefined);
    return new FluencePeer(marine, avm);
};
