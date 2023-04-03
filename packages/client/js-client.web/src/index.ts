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
import type { RelayOptions, ClientConfig, IFluenceClient } from '@fluencelabs/interfaces';
import { ClientPeer, makeClientPeerConfig } from '@fluencelabs/js-peer/dist/clientPeer/ClientPeer.js';
import { callAquaFunction } from '@fluencelabs/js-peer/dist/compilerSupport/callFunction.js';
import { registerService } from '@fluencelabs/js-peer/dist/compilerSupport/registerService.js';
import { MarineBasedAvmRunner } from '@fluencelabs/js-peer/dist/jsPeer/avm.js';
import { MarineBackgroundRunner } from '@fluencelabs/js-peer/dist/marine/worker';
import { WasmLoaderFromUrl, WorkerLoaderFromUrl } from '@fluencelabs/js-peer/dist/marine/deps-loader/web.js';

const defaultNames = {
    marine: 'marine-js.wasm',
    avm: 'avm.wasm',
    worker: 'worker-script.js',
};

const createClient = async (relay: RelayOptions, config: ClientConfig): Promise<IFluenceClient> => {
    const workerLoader = new WorkerLoaderFromUrl(defaultNames.worker);
    const controlModuleLoader = new WasmLoaderFromUrl(defaultNames.marine);
    const avmModuleLoader = new WasmLoaderFromUrl(defaultNames.avm);

    const marine = new MarineBackgroundRunner(workerLoader, controlModuleLoader);
    const avm = new MarineBasedAvmRunner(marine, avmModuleLoader);
    const { keyPair, peerConfig, relayConfig } = await makeClientPeerConfig(relay, config);
    const client: IFluenceClient = new ClientPeer(peerConfig, relayConfig, keyPair, marine, avm);
    await client.connect();
    return client;
};

const publicFluenceInterface = {
    clientFactory: createClient,
    callAquaFunction,
    registerService,
};

// @ts-ignore
globalThis.fluence = publicFluenceInterface;
