import type { FluencePeer } from '@fluencelabs/js-peer/dist/FluencePeer';

export const getDefaultPeer = (): FluencePeer => {
    // @ts-ignore
    return globalThis.defaultPeer;
};
