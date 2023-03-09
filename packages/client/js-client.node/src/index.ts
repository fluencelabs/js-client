import * as platform from 'platform';

import { FluencePeer } from '@fluencelabs/js-peer/dist/js-peer/FluencePeer.js';
import { callAquaFunction } from '@fluencelabs/js-peer/dist/compilerSupport/callFunction.js';
import { registerService } from '@fluencelabs/js-peer/dist/compilerSupport/registerService.js';
import { MarineBasedAvmRunner } from '@fluencelabs/js-peer/dist/js-peer/avm.js';
import { MarineBackgroundRunner } from '@fluencelabs/js-peer/dist/marine/worker/index.js';
import { WasmLoaderFromNpm } from '@fluencelabs/js-peer/dist/marine/deps-loader/node.js';
import { WorkerLoader } from '@fluencelabs/js-peer/dist/marine/worker-script/workerLoader.js';

throwIfNotSupported();

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

export const createClient = () => {
    const workerLoader = new WorkerLoader();
    const controlModuleLoader = new WasmLoaderFromNpm(defaultNames.marine.package, defaultNames.marine.file);
    const avmModuleLoader = new WasmLoaderFromNpm(defaultNames.avm.package, defaultNames.avm.file);

    const marine = new MarineBackgroundRunner(workerLoader, controlModuleLoader);
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

function throwIfNotSupported() {
    if (platform.name === 'Node.js' && platform.version) {
        const version = platform.version.split('.').map(Number);
        const major = version[0];
        if (major < 16) {
            throw new Error(
                'Fluence JS Client requires node.js version >= "16.x"; Detected ' +
                    platform.description +
                    ' Please update node.js to version 16 or higher.\nYou can use https://nvm.sh utility to update node.js version: "nvm install 17 && nvm use 17 && nvm alias default 17"',
            );
        }
    }
}
