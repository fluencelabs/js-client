import type { CallAquaFunction, IFluenceClient, RegisterService } from '@fluencelabs/interfaces';

type PublicFluenceInterface = {
    clientFactory: () => IFluenceClient;
    defaultClient: IFluenceClient;
    callAquaFunction: CallAquaFunction;
    registerService: RegisterService;
};

export const getFluenceInterfaceFromGlobalThis = (): PublicFluenceInterface | undefined => {
    // @ts-ignore
    return globalThis.fluence;
};

// TODO: DXJ-271
const REJECT_MESSAGE = 'You probably forgot to add script tag. Read about it here: ';

// Let's assume that if the library has not been loaded in 5 seconds, then the user has forgotten to add the script tag
const POLL_PEER_TIMEOUT = 5000;

// The script might be cached so need to try loading it ASAP, thus short interval
const POLL_PEER_INTERVAL = 100;

/**
 * Wait until the js client script it loaded and return the default peer from globalThis
 */
export const getFluenceInterface = (): Promise<PublicFluenceInterface> => {
    // If the script is already loaded, then return the value immediately
    const optimisticResult = getFluenceInterfaceFromGlobalThis();
    if (optimisticResult) {
        return Promise.resolve(optimisticResult);
    }

    return new Promise((resolve, reject) => {
        // This function is internal
        // Make it sure that would be zero way for unnecessary types
        // to break out into the public API
        let interval: any;
        let hits = POLL_PEER_TIMEOUT / POLL_PEER_INTERVAL;
        interval = setInterval(() => {
            if (hits === 0) {
                clearInterval(interval);
                reject(REJECT_MESSAGE);
            }

            let res = getFluenceInterfaceFromGlobalThis();
            if (res) {
                clearInterval(interval);
                resolve(res);
            }
            hits--;
        }, POLL_PEER_INTERVAL);
    });
};
