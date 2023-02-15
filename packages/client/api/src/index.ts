import { getFluenceInterface } from './util.js';
import type { IFluenceClient, ClientOptions, RelayOptions } from '@fluencelabs/interfaces';
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
        return fluence.defaultPeer.start({ ...options, relay });
    },

    /**
     * Disconnect from the Fluence network
     */
    disconnect: async (): Promise<void> => {
        const fluence = await getFluenceInterface();
        return fluence.defaultPeer.stop();
    },

    /**
     * Get the underlying Fluence Peer instance
     * @returns Fluence Peer instance
     */
    getPeer: async (): Promise<IFluenceClient> => {
        const fluence = await getFluenceInterface();
        return fluence.defaultPeer;
    },
};

export const DangerouslyCreateClient = async (): Promise<IFluenceClient> => {
    const fluence = await getFluenceInterface();
    return fluence.peerFactory();
};
