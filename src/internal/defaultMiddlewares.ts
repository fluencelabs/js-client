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
        if (Array.isArray(val)) {
            if (val.length !== tetraplet.length) {
                throw new Error(
                    `Tetraplet for arument ${index} is expected to have the same number of elements as the argument`,
                );
            }

            return val.map((elem, elemIndex) => {
                return new CallServiceArg(elem, tetraplet[elemIndex]);
            });
        }

        if (tetraplet.length !== 1) {
            throw new Error(`Tetraplet for arument ${index} is expected to have the only a single element`);
        }
        return new CallServiceArg(val, tetraplet[0]);
    });

    req.wrappedArgs = wrappedArgs;
    next();
};
