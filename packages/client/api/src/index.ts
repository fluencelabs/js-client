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
import { getFluenceInterface, getFluenceInterfaceFromGlobalThis } from './util.js';
import {
    IFluenceClient,
    ClientConfig,
    RelayOptions,
    ConnectionState,
    CallAquaFunctionType,
    RegisterServiceType,
} from '@fluencelabs/interfaces';
export type { IFluenceClient, ClientConfig as ClientOptions, CallParams } from '@fluencelabs/interfaces';

export {
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

export { v5_callFunction, v5_registerService } from './compilerSupport/implementation.js';

/**
 * Public interface to Fluence Network
 */
export const Fluence = {
    /**
     * Connect to the Fluence network
     * @param relay - relay node to connect to
     * @param config - client configuration
     */
    connect: async (relay: RelayOptions, config?: ClientConfig): Promise<void> => {
        const fluence = await getFluenceInterface();
        const client = await fluence.clientFactory(relay, config);
        fluence.defaultClient = client;
    },

    /**
     * Disconnect from the Fluence network
     */
    disconnect: async (): Promise<void> => {
        const fluence = await getFluenceInterface();
        await fluence.defaultClient?.disconnect();
        fluence.defaultClient = undefined;
    },

    /**
     * Handle connection state changes. Immediately returns the current connection state
     */
    onConnectionStateChange(handler: (state: ConnectionState) => void): ConnectionState {
        const optimisticResult = getFluenceInterfaceFromGlobalThis();
        if (optimisticResult && optimisticResult.defaultClient) {
            return optimisticResult.defaultClient.onConnectionStateChange(handler);
        }

        getFluenceInterface().then((fluence) => {
            fluence.defaultClient?.onConnectionStateChange(handler);
        });

        return 'disconnected';
    },

    /**
     * Low level API. Get the underlying client instance which holds the connection to the network
     * @returns IFluenceClient instance
     */
    getClient: async (): Promise<IFluenceClient> => {
        const fluence = await getFluenceInterface();
        if (!fluence.defaultClient) {
            throw new Error('Fluence client is not initialized. Call Fluence.connect() first');
        }
        return fluence.defaultClient;
    },
};

/**
 * Low level API. Generally you need Fluence.connect() instead.
 * @returns IFluenceClient instance
 */
export const createClient = async (relay: RelayOptions, config?: ClientConfig): Promise<IFluenceClient> => {
    const fluence = await getFluenceInterface();
    return await fluence.clientFactory(relay, config);
};

/**
 * Low level API. Generally you should use code generated by the Aqua compiler.
 */
export const callAquaFunction: CallAquaFunctionType = async (args) => {
    const fluence = await getFluenceInterface();
    return await fluence.callAquaFunction(args);
};

/**
 * Low level API. Generally you should use code generated by the Aqua compiler.
 */
export const registerService: RegisterServiceType = async (args) => {
    const fluence = await getFluenceInterface();
    return await fluence.registerService(args);
};
