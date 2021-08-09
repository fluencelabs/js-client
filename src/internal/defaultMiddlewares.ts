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
