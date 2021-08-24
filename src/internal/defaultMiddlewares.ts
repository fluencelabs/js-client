import { CallServiceArg, CallServiceData, CallServiceResult, Middleware, ResultCodes } from './CallServiceHandler';

/**
 * Error catching middleware
 */
export const errorHandler: Middleware = async (
    req: CallServiceData,
    resp: CallServiceResult,
    next: Function,
): Promise<void> => {
    try {
        await next();
    } catch (e) {
        resp.retCode = ResultCodes.exceptionInHandler;
        resp.result = e.toString();
    }
};
