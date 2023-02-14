import type { IFluenceClient, ClientOptions } from '@fluencelabs/interfaces';

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
