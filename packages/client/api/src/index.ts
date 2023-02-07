import type { IFluencePeer } from '@fluencelabs/js-peer/dist/interfaces/index.js';
import type { PeerConfig } from '@fluencelabs/js-peer/dist/interfaces/peerConfig';

const getPeerFromGlobalThis = (): IFluencePeer | undefined => {
    // @ts-ignore
    return globalThis.defaultPeer;
};

const REJECT_MESSAGE = "Couldn't load the peer. Please try this and this or refer to the docs bla bla";

/**
 * Wait until the js client script it loaded and return the default peer from globalThis
 */
export const getDefaultPeer = (): Promise<IFluencePeer> => {
    return new Promise((resolve, reject) => {
        let interval: NodeJS.Timer | undefined;
        let hits = 20;
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
     * @param config - object specifying peer configuration
     */
    start: async (config?: PeerConfig): Promise<void> => {
        const peer = await getDefaultPeer();
        return peer.start(config);
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
     * Get the default peer's status
     * @returns Default peer's status
     */
    // getStatus: async () => {
    //     const peer = await getDefaultPeer();
    //     return peer.getStatus();
    // },

    /**
     * Get the default peer instance
     * @returns the default peer instance
     */
    getPeer: async (): Promise<IFluencePeer> => {
        return getDefaultPeer();
    },
};
