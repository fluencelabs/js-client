import { MarineBackgroundRunner } from '@fluencelabs/marine.background-runner';
import { MarineBasedAvmRunner } from '@fluencelabs/js-peer/dist/avm';
import { marineLogFunction } from '@fluencelabs/js-peer/dist/peerUtils';
import { FluencePeer } from '@fluencelabs/js-peer/dist/FluencePeer';
import { InlinedWorkerLoader, WasmWebLoader } from '@fluencelabs/marine.deps-loader.web';

export const defaultNames = {
    avm: 'avm.wasm',
    marine: 'marine-js.wasm',
};

export const makeDefaultPeer = () => {
    const workerLoader = new InlinedWorkerLoader();
    const controlModuleLoader = new WasmWebLoader(defaultNames.marine);
    const avmModuleLoader = new WasmWebLoader(defaultNames.avm);

    const marine = new MarineBackgroundRunner(workerLoader, controlModuleLoader, marineLogFunction);
    const avm = new MarineBasedAvmRunner(marine, avmModuleLoader, undefined);
    return new FluencePeer(marine, avm);
};

// @ts-ignore
globalThis.defaultPeer = makeDefaultPeer();
