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
import { BlobWorker, Worker } from 'threads';
import { doRegisterNodeUtils } from './services/NodeUtils.js';
import { fetchResource } from './fetchers/index.js';
import process from 'process';
import path from 'path';
import url from 'url';
import module from 'module';

const isNode = typeof process !== 'undefined' && process?.release?.name === 'node';

const fetchWorkerCode = () => fetchResource('@fluencelabs/marine-worker', '/dist/browser/marine-worker.umd.js').then(res => res.text());
const fetchMarineJsWasm = () => fetchResource('@fluencelabs/marine-js', '/dist/marine-js.wasm').then(res => res.arrayBuffer());
const fetchAvmWasm = () => fetchResource('@fluencelabs/avm', '/dist/avm.wasm').then(res => res.arrayBuffer());

const createClient = async (relay: RelayOptions, config: ClientConfig): Promise<IFluenceClient> => {
    const marineJsWasm = await fetchMarineJsWasm();
    const avmWasm = await fetchAvmWasm();
    
    const marine = new MarineBackgroundRunner({
        async getValue() {
            if (isNode) {
                const require = module.createRequire(import.meta.url);
                const pathToThisFile = path.dirname(url.fileURLToPath(import.meta.url));
                const pathToWorker = require.resolve('@fluencelabs/marine-worker');
                const relativePathToWorker = path.relative(pathToThisFile, pathToWorker);
                return new Worker(relativePathToWorker);
            } else {
                const workerCode = await fetchWorkerCode();
                return BlobWorker.fromText(workerCode)
            }
        },
        start() {
            return Promise.resolve(undefined);
        },
        stop() {
            return Promise.resolve(undefined);
        },
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
        doRegisterNodeUtils(client);
    }
    await client.connect();
    return client;
};

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

export { createClient, callAquaFunction, registerService };
export { getFluenceInterface, getFluenceInterfaceFromGlobalThis } from './util/loadClient.js';
