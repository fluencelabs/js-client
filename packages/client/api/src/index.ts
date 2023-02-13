import type { IFluenceClient, ClientOptions } from '@fluencelabs/interfaces/fluenceClient';

export { IFluenceClient, ClientOptions, CallParams } from '@fluencelabs/interfaces/fluenceClient';

// TODO: hack needed to kinda have backward compat with compiler api
export type FluencePeer = IFluenceClient;

const getPeerFromGlobalThis = (): IFluenceClient | undefined => {
    // @ts-ignore
    return globalThis.defaultPeer;
};

// TODO: DXJ-271
const REJECT_MESSAGE = 'You probably forgot to add script tag. Read about it here: ';

/**
 * Wait until the js client script it loaded and return the default peer from globalThis
 */
export const getDefaultPeer = (): Promise<IFluenceClient> => {
    return new Promise((resolve, reject) => {
        let interval: NodeJS.Timer | undefined;
        let hits = 50;
        interval = setInterval(() => {
            if (hits === 0) {
                clearInterval(interval);
                reject(REJECT_MESSAGE);
            }

            let res = getPeerFromGlobalThis();
            if (res) {
                clearInterval(interval);
                resolve(res);
            }
            hits--;
        }, 100);
    });
};

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
