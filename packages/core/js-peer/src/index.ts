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
import type { ClientConfig, IFluenceClient, RelayOptions, ConnectionState, CallAquaFunctionType, RegisterServiceType } from '@fluencelabs/interfaces';
import { ClientPeer, makeClientPeerConfig } from './clientPeer/ClientPeer.js';
import { callAquaFunction } from './compilerSupport/callFunction.js';
import { registerService } from './compilerSupport/registerService.js';
import { MarineBackgroundRunner } from './marine/worker/index.js';
// @ts-ignore
import { BlobWorker } from 'threads';
import * as fs from 'fs';
import process from 'process';
import { Buffer } from 'buffer';
import { doRegisterNodeUtils } from './services/NodeUtils.js';
import { createRequire } from 'module';

const WORKER_VERSION = '__WORKER_VERSION__';
const MARINE_VERSION = '__MARINE_VERSION__';
const AVM_VERSION = '__AVM_VERSION__';
// Override if necessary
const CDN_ROOT = 'https://unpkg.com/';

const isNode = typeof process !== 'undefined' && process?.release?.name === 'node';

async function fetchResource(packageName: string, assetPath: string, version: string) {
    if (isNode) {
        const require = createRequire(import.meta.url);
        
        const file = await new Promise<Buffer>((resolve, reject) => {
            // Cannot use 'fs/promises' with current vite config. This module is not polyfilled by default.
            const workerFilePath = require.resolve(packageName + assetPath);
            fs.readFile(workerFilePath, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data);
            });
        });
        return new Response(file, {
            headers: {
                'Content-type':
                    assetPath.endsWith('.wasm')
                        ? 'application/wasm'
                        : assetPath.endsWith('.js')
                            ? 'application/javascript'
                            : 'application/text'
            }
        });
    } else {
        // Will work everywhere fetch is supported.
        return fetch(new globalThis.URL(`${packageName}@${version}${assetPath}`, CDN_ROOT));
    }
}

const fetchWorkerCode = () => fetchResource('@fluencelabs/marine-worker', '', WORKER_VERSION).then(res => res.text());
const fetchMarineJsWasm = () => fetchResource('@fluencelabs/marine-js', '/dist/marine-js.wasm', MARINE_VERSION).then(res => res.arrayBuffer());
const fetchAvmWasm = () => fetchResource('@fluencelabs/avm', '/dist/avm.wasm', AVM_VERSION).then(res => res.arrayBuffer());

const bufferToSharedArrayBuffer = (buffer: Buffer): SharedArrayBuffer => {
    const sab = new SharedArrayBuffer(buffer.length);
    const tmp = new Uint8Array(sab);
    tmp.set(buffer, 0);
    return sab;
};

export const createClient = async (relay: RelayOptions, config: ClientConfig): Promise<IFluenceClient> => {
    const workerCode = await fetchWorkerCode();
    const workerLoader = BlobWorker.fromText(workerCode);

    const marineJsWasm = bufferToSharedArrayBuffer(Buffer.from(await fetchMarineJsWasm()));
    const avmWasm = bufferToSharedArrayBuffer(Buffer.from(await fetchAvmWasm()));

    const marine = new MarineBackgroundRunner({
        getValue() {
            return workerLoader;
        }, start(): Promise<void> {
            return Promise.resolve(undefined);
        }, stop(): Promise<void> {
            return Promise.resolve(undefined);
        }
    }, {
        getValue() {
            return marineJsWasm;
        }, start(): Promise<void> {
            return Promise.resolve(undefined);
        }, stop(): Promise<void> {
            return Promise.resolve(undefined);
        }
    }, {
        getValue() {
            return avmWasm;
        }, start(): Promise<void> {
            return Promise.resolve(undefined);
        }, stop(): Promise<void> {
            return Promise.resolve(undefined);
        }
    });
    const { keyPair, peerConfig, relayConfig } = await makeClientPeerConfig(relay, config);
    const client: IFluenceClient = new ClientPeer(peerConfig, relayConfig, keyPair, marine);
    if (isNode) {
        registerNodeOnlyServices(client);
    }
    await client.connect();
    return client;
};

function registerNodeOnlyServices(client: IFluenceClient) {
    doRegisterNodeUtils(client);
}

/**
 * Public interface to Fluence Network
 */
export const Fluence = {
    defaultClient: undefined as (IFluenceClient | undefined),
    /**
     * Connect to the Fluence network
     * @param relay - relay node to connect to
     * @param config - client configuration
     */
    connect: async function(relay: RelayOptions, config: ClientConfig): Promise<void> {
        const client = await createClient(relay, config);
        this.defaultClient = client;
    },

    /**
     * Disconnect from the Fluence network
     */
    disconnect: async function(): Promise<void> {
        await this.defaultClient?.disconnect();
        this.defaultClient = undefined;
    },

    /**
     * Handle connection state changes. Immediately returns the current connection state
     */
    onConnectionStateChange(handler: (state: ConnectionState) => void): ConnectionState {
        return this.defaultClient?.onConnectionStateChange(handler) || 'disconnected';
    },

    /**
     * Low level API. Get the underlying client instance which holds the connection to the network
     * @returns IFluenceClient instance
     */
    getClient: async function(): Promise<IFluenceClient> {
        if (!this.defaultClient) {
            throw new Error('Fluence client is not initialized. Call Fluence.connect() first');
        }
        return this.defaultClient;
    },
};

export type { IFluenceClient, ClientConfig, CallParams } from '@fluencelabs/interfaces';

export type {
    ArrayType,
    ArrowType,
    ArrowWithCallbacks,
    ArrowWithoutCallbacks,
    BottomType,
    FunctionCallConstants,
    FunctionCallDef,
    LabeledProductType,
    NilType,
    NonArrowType,
    OptionType,
    ProductType,
    ScalarNames,
    ScalarType,
    ServiceDef,
    StructType,
    TopType,
    UnlabeledProductType,
    CallAquaFunctionType,
    CallAquaFunctionArgs,
    PassedArgs,
    FnConfig,
    RegisterServiceType,
    RegisterServiceArgs,
} from '@fluencelabs/interfaces';

export { v5_callFunction, v5_registerService } from './api.js';

// @ts-ignore
globalThis.new_fluence = Fluence;

// @ts-ignore
globalThis.fluence = {
    clientFactory: createClient,
    callAquaFunction,
    registerService,
};

export { callAquaFunction, registerService };
