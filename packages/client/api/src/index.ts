import { getFluenceInterface, getFluenceInterfaceFromGlobalThis } from './util.js';
import {
    IFluenceClient,
    ClientOptions,
    RelayOptions,
    ConnectionState,
    ConnectionStates,
} from '@fluencelabs/interfaces';
export type { IFluenceClient, ClientOptions, CallParams } from '@fluencelabs/interfaces';

export {
    ArrayType,
    ArrowType,
    ArrowWithCallbacks,
    ArrowWithoutCallbacks,
    BottomType,
    FnConfig,
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
} from '@fluencelabs/interfaces';

export {
    callFunction as v5_callFunction,
    registerService as v5_registerService,
} from './compilerSupport/implementation.js';

/**
 * Public interface to Fluence Network
 */
export const Fluence = {
    /**
     * Connect to the Fluence network
     * @param relay - relay node to connect to
     * @param options - client options
     */
    connect: async (relay: RelayOptions, options?: ClientOptions): Promise<void> => {
        const fluence = await getFluenceInterface();
        return fluence.defaultClient.connect(relay, options);
    },

    /**
     * Disconnect from the Fluence network
     */
    disconnect: async (): Promise<void> => {
        const fluence = await getFluenceInterface();
        return fluence.defaultClient.disconnect();
    },

    /**
     * Handle connection state changes. Immediately returns the current connection state
     */
    onConnectionStateChange(handler: (state: ConnectionState) => void): ConnectionState {
        const optimisticResult = getFluenceInterfaceFromGlobalThis();
        if (optimisticResult) {
            return optimisticResult.defaultClient.onConnectionStateChange(handler);
        }

        getFluenceInterface().then((fluence) => fluence.defaultClient.onConnectionStateChange(handler));

        return 'disconnected';
    },

    /**
     * Low level API. Get the underlying client instance which holds the connection to the network
     * @returns IFluenceClient instance
     */
    getClient: async (): Promise<IFluenceClient> => {
        const fluence = await getFluenceInterface();
        return fluence.defaultClient;
    },
};

/**
 * Low level API. Generally you need Fluence.connect() instead.
 * @returns IFluenceClient instance
 */
export const createClient = async (): Promise<IFluenceClient> => {
    const fluence = await getFluenceInterface();
    return fluence.clientFactory();
};
