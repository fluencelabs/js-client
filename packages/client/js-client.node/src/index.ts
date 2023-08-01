/*
 * Copyright 2023 Fluence Labs Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as platform from 'platform';

import type { ClientConfig, IFluenceClient, RelayOptions } from '@fluencelabs/interfaces';
import { ClientPeer, makeClientPeerConfig } from '@fluencelabs/js-peer/dist/clientPeer/ClientPeer.js';
import { callAquaFunction } from '@fluencelabs/js-peer/dist/compilerSupport/callFunction.js';
import { registerService } from '@fluencelabs/js-peer/dist/compilerSupport/registerService.js';
import { MarineBasedAvmRunner } from '@fluencelabs/js-peer/dist/jsPeer/avm.js';
import { MarineBackgroundRunner } from '@fluencelabs/js-peer/dist/marine/worker/index.js';
import { WasmLoaderFromNpm } from '@fluencelabs/js-peer/dist/marine/deps-loader/node.js';
import { doRegisterNodeUtils } from '@fluencelabs/js-peer/dist/services/NodeUtils.js';
import { encode, decode } from 'js-base64';
import parseDataURL from "data-urls";

import WorkerInlineUrl from '@fluencelabs/marine-worker/dist/marine-worker.umd.сjs?url';

// @ts-ignore
import { BlobWorker, Worker } from 'threads';

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

const createClient = async (relay: RelayOptions, config: ClientConfig): Promise<IFluenceClient> => {
    const data = /data:application\/\w+?;base64,(.+)/.exec(WorkerInlineUrl)?.[1]!;
    
    const workerLoader = BlobWorker.fromText(decode(data));
    const controlModuleLoader = new WasmLoaderFromNpm(defaultNames.marine.package, defaultNames.marine.file);
    const avmModuleLoader = new WasmLoaderFromNpm(defaultNames.avm.package, defaultNames.avm.file);

    const marine = new MarineBackgroundRunner(workerLoader, controlModuleLoader);
    const avm = new MarineBasedAvmRunner(marine, avmModuleLoader);
    const { keyPair, peerConfig, relayConfig } = await makeClientPeerConfig(relay, config);
    const client: IFluenceClient = new ClientPeer(peerConfig, relayConfig, keyPair, marine, avm);
    registerNodeOnlyServices(client);
    await client.connect();
    return client;
};

function registerNodeOnlyServices(client: IFluenceClient) {
    doRegisterNodeUtils(client);
}

const publicFluenceInterface = {
    clientFactory: createClient,
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
