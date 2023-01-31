import { FluencePeer } from '@fluencelabs/js-peer/dist/js-peer/FluencePeer';
import { MarineBasedAvmRunner } from '@fluencelabs/js-peer/dist/js-peer/avm';
import { MarineBackgroundRunner } from '@fluencelabs/js-peer/dist/marine/worker';
import { marineLogFunction } from '@fluencelabs/js-peer/dist/js-peer/utils';
import { WasmWebLoader } from '@fluencelabs/js-peer/dist/marine/deps-loader/web';
import { InlinedWorkerLoader } from '@fluencelabs/js-peer/dist/marine/deps-loader/common';

export const defaultNames = {
    avm: 'avm.wasm',
    marine: 'marine-js.wasm',
};

export const makeDefaultPeer = () => {
    const workerLoader = new InlinedWorkerLoader('__worker__');
    const controlModuleLoader = new WasmWebLoader(defaultNames.marine);
    const avmModuleLoader = new WasmWebLoader(defaultNames.avm);

    const marine = new MarineBackgroundRunner(workerLoader, controlModuleLoader, marineLogFunction);
    const avm = new MarineBasedAvmRunner(marine, avmModuleLoader, undefined);
    return new FluencePeer(marine, avm);
};

// @ts-ignore
globalThis.defaultPeer = makeDefaultPeer();
