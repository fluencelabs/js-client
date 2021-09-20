import { CallServiceArg, CallServiceData, CallServiceResult, Middleware, ResultCodes } from './CallServiceHandler';

/**
 * Error catching middleware
 */
export const errorHandler: Middleware = async (req: CallServiceData, resp: CallServiceResult, next: Function) => {
    try {
        await next();
    } catch (e) {
        resp.retCode = ResultCodes.exceptionInHandler;
        resp.result = `Handler failed. fnName="${req.fnName}" serviceId="${req.serviceId}" error: ${e.toString()}`;
    }
};
