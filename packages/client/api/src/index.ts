import type { IFluenceClient, ClientOptions } from '@fluencelabs/interfaces';
import { getDefaultPeer } from './util.js';
export type { IFluenceClient, ClientOptions, CallParams as CallParams$$ } from '@fluencelabs/interfaces';

export { callFunction, registerService  } from "./compilerSupport/implementation.js";

export type { SecurityTetraplet } from '@fluencelabs/avm';
export type { LogLevel } from '@fluencelabs/marine-js/dist/types';


/**
 * Public interface to Fluence JS
 */
export const Fluence = {
    /**
     * Initializes the default peer: starts the Aqua VM, initializes the default call service handlers
     * and (optionally) connect to the Fluence network
     * @param options - object specifying peer configuration
     */
    start: async (options?: ClientOptions): Promise<void> => {
        const peer = await getDefaultPeer();
        return peer.start(options);
    },

    /**
     * Un-initializes the default peer: stops all the underlying workflows, stops the Aqua VM
     * and disconnects from the Fluence network
     */
    stop: async (): Promise<void> => {
        const peer = await getDefaultPeer();
        return peer.stop();
    },

    /**
     * Get the default peer instance
     * @returns the default peer instance
     */
    getPeer: async (): Promise<IFluenceClient> => {
        return getDefaultPeer();
    },
};
