import { getFluenceInterface, getFluenceInterfaceFromGlobalThis } from './util.js';
import { IFluenceClient, ClientConfig, RelayOptions, ConnectionState, ConnectionStates } from '@fluencelabs/interfaces';
export type { IFluenceClient, ClientConfig as ClientOptions, CallParams } from '@fluencelabs/interfaces';

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
        return fluence.defaultClient?.disconnect();
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
        return fluence.defaultClient!;
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
