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
import { doRegisterNodeUtils } from '@fluencelabs/js-peer/dist/services/NodeUtils.js';

// @ts-ignore
import { BlobWorker, Worker } from 'threads';
import fetch from 'cross-fetch';
import fs from 'fs';

throwIfNotSupported();

const WORKER_VERSION = '__WORKER_VERSION__';
const MARINE_VERSION = '__MARINE_VERSION__';
const AVM_VERSION = '__AVM_VERSION__';
const CDN_ROOT = '__CDN_ROOT__';
const CLIENT_ENV = '__CLIENT_ENV__' as 'browser' | 'node';

async function fetchWorker(packageName: string, assetPath: string, version: string) {
    if (CLIENT_ENV === 'browser') {
        return fetch(new globalThis.URL(`${packageName}@${version}${assetPath}`, CDN_ROOT)).then(res => res.text());
    } else {
        const file = await new Promise<Buffer>((resolve, reject) => {
            // Cannot use 'fs/promises' with current vite config. This module is not polyfilled by default.
            fs.readFile(new globalThis.URL(`../node_modules/${packageName}${assetPath}`, import.meta.url), (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data);
            });
        });
        return file.toString();
    }
}

async function fetchWasm(packageName: string, assetPath: string, version: string) {
    if (CLIENT_ENV === 'browser') {
        return fetch(new globalThis.URL(`${packageName}@${version}${assetPath}`, CDN_ROOT)).then(WebAssembly.compileStreaming);
    } else {
        const file = await new Promise<Buffer>((resolve, reject) => {
            // Cannot use 'fs/promises' with current vite config. This module is not polyfilled by default.
            fs.readFile(new globalThis.URL(`../node_modules/${packageName}${assetPath}`, import.meta.url), (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data);
            });
        });
        return WebAssembly.compile(file);
    }
}

const workerFile = CLIENT_ENV === 'browser' ? '/dist/browser/marine-worker.js' : '/dist/node/marine-worker.umd.cjs';
const fetchWorkerCode = () => fetchWorker('@fluencelabs/marine-worker', workerFile, WORKER_VERSION);
const fetchMarineJsWasm = () => fetchWasm('@fluencelabs/marine-js', '/dist/marine-js.wasm', MARINE_VERSION);
const fetchAvmWasm = () => fetchWasm('@fluencelabs/avm', '/dist/avm.wasm', AVM_VERSION);

const createClient = async (relay: RelayOptions, config: ClientConfig): Promise<IFluenceClient> => {
    const workerCode = await fetchWorkerCode();
    const workerLoader = BlobWorker.fromText(workerCode);

    const marine = new MarineBackgroundRunner(workerLoader, { getValue: fetchMarineJsWasm, start: () => Promise.resolve(), stop: () => Promise.resolve() });
    const avm = new MarineBasedAvmRunner(marine, { getValue: fetchAvmWasm, start: () => Promise.resolve(), stop: () => Promise.resolve() });
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
