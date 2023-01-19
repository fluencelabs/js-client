import { MarineBackgroundRunner } from '@fluencelabs/marine.background-runner';
import { MarineBasedAvmRunner } from '@fluencelabs/js-peer/dist/avm';
import { marineLogFunction } from '@fluencelabs/js-peer/dist/peerUtils';
import { FluencePeer } from '@fluencelabs/js-peer/dist/FluencePeer';
import { InlinedWorkerLoader, InlinedWasmLoader } from '@fluencelabs/marine.deps-loader.web';

export const makeDefaultPeer = () => {
    const workerLoader = new InlinedWorkerLoader();
    const controlModuleLoader = new InlinedWasmLoader('__marine__');
    const avmModuleLoader = new InlinedWasmLoader('__avm__');
    const marine = new MarineBackgroundRunner(workerLoader, controlModuleLoader, marineLogFunction);
    const avm = new MarineBasedAvmRunner(marine, avmModuleLoader, undefined);
    return new FluencePeer(marine, avm);
    //return 1;
};

// @ts-ignore
globalThis.defaultPeer = makeDefaultPeer();
