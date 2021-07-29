import { CallServiceArg, CallServiceData, CallServiceResult, Middleware, ResultCodes } from './CallServiceHandler';

/**
 * Error catching middleware
 */
export const errorHandler: Middleware = (req: CallServiceData, resp: CallServiceResult, next: Function): void => {
    try {
        next();
    } catch (e) {
        resp.retCode = ResultCodes.exceptionInHandler;
        resp.result = e.toString();
    }
};

export const wrapTetrapltes: Middleware = (req: CallServiceData, resp: CallServiceResult, next: Function): void => {
    if (req.args.length !== req.tetraplets.length) {
        throw new Error('Tetraplets length is expected to be equal to args length');
    }

    const wrappedArgs = req.args.map((val, index) => {
        const tetraplet = req.tetraplets[index];
        return new CallServiceArg(val, tetraplet);
    });

    req.wrappedArgs = wrappedArgs;
    next();
};
