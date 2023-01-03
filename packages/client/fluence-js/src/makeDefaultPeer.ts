import { isBrowser, isNode } from 'browser-or-node';
import { MarineBackgroundRunner } from '@fluencelabs/marine-runner';
import type { IWasmLoader, IWorkerLoader } from '@fluencelabs/interfaces';
import { MarineBasedAvmRunner } from '@fluencelabs/js-peer/dist/avm';
import { marineLogFunction } from '@fluencelabs/js-peer/dist/utils';
import { FluencePeer } from './';

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
    let workerLoader: IWorkerLoader;
    let controlModuleLoader: IWasmLoader;
    let avmModuleLoader: IWasmLoader;
    if (isBrowser) {
        const { InlinedWorkerLoader, WasmWebLoader } = require('@fluencelabs/marine.deps-loader.web');
        workerLoader = new InlinedWorkerLoader();
        controlModuleLoader = new WasmWebLoader(defaultNames.marine.file);
        avmModuleLoader = new WasmWebLoader(defaultNames.avm.file);
    } else if (isNode) {
        const { InlinedWorkerLoader, WasmNpmLoader } = require('@fluencelabs/marine.deps-loader.node');
        workerLoader = new InlinedWorkerLoader();
        controlModuleLoader = new WasmNpmLoader(defaultNames.marine.package, defaultNames.marine.file);
        avmModuleLoader = new WasmNpmLoader(defaultNames.avm.package, defaultNames.avm.file);
    } else {
        throw new Error('Unkown environment');
    }

    const marine = new MarineBackgroundRunner(workerLoader, controlModuleLoader, marineLogFunction);
    const avm = new MarineBasedAvmRunner(marine, avmModuleLoader, undefined);
    return new FluencePeer(marine, avm);
};
