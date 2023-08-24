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

import avmWasmUrl from '../node_modules/@fluencelabs/avm/dist/avm.wasm?url';
import marineJsWasmUrl from '../node_modules/@fluencelabs/marine-js/dist/marine-js.wasm?url';
import workerCodeUrl from '../node_modules/@fluencelabs/marine-worker/dist/__ENV__/marine-worker.umd.cjs?url';

const JS_CLIENT_VERSION = '__JS_CLIENT_VERSION__';

const isNode = typeof process !== 'undefined' && process?.release?.name === 'node';

const fetchWorkerCode = () => fetchResource(workerCodeUrl, JS_CLIENT_VERSION).then(res => res.text());
const fetchMarineJsWasm = () => fetchResource(marineJsWasmUrl, JS_CLIENT_VERSION).then(res => res.arrayBuffer());
const fetchAvmWasm = () => fetchResource(avmWasmUrl, JS_CLIENT_VERSION).then(res => res.arrayBuffer());

const createClient = async (relay: RelayOptions, config: ClientConfig): Promise<IFluenceClient> => {
    const workerCode = await fetchWorkerCode();
    
    const marineJsWasm = await fetchMarineJsWasm();
    const avmWasm = await fetchAvmWasm();
    
    const marine = new MarineBackgroundRunner({
        getValue() {
            return BlobWorker.fromText(workerCode)
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
