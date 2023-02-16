import { FluencePeer } from '@fluencelabs/js-peer/dist/js-peer/FluencePeer.js';
import { callAquaFunction } from '@fluencelabs/js-peer/dist/compilerSupport/callFunction.js';
import { registerService } from '@fluencelabs/js-peer/dist/compilerSupport/registerService.js';
import { MarineBasedAvmRunner } from '@fluencelabs/js-peer/dist/js-peer/avm.js';
import { MarineBackgroundRunner } from '@fluencelabs/js-peer/dist/marine/worker';
import { checkConnection, marineLogFunction } from '@fluencelabs/js-peer/dist/js-peer/utils.js';
import { InlinedWorkerLoader, InlinedWasmLoader } from '@fluencelabs/js-peer/dist/marine/deps-loader/common.js';

const createClient = () => {
    const workerLoader = new InlinedWorkerLoader('___worker___');
    const controlModuleLoader = new InlinedWasmLoader('___marine___');
    const avmModuleLoader = new InlinedWasmLoader('___avm___');

    const marine = new MarineBackgroundRunner(workerLoader, controlModuleLoader, marineLogFunction);
    const avm = new MarineBasedAvmRunner(marine, avmModuleLoader, undefined);
    return new FluencePeer(marine, avm);
};

const publicFluenceInterface = {
    clientFactory: createClient,
    defaultClient: createClient(),
    callAquaFunction,
    registerService,
};

// @ts-ignore
globalThis.fluence = publicFluenceInterface;
