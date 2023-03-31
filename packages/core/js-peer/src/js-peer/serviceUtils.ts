import { CallServiceData, CallServiceResult, CallServiceResultType, ResultCodes } from '../interfaces/commonTypes.js';

export const doNothing = (..._args: Array<unknown>) => undefined;

export const WrapFnIntoServiceCall =
    (fn: (args: any[]) => CallServiceResultType) =>
    (req: CallServiceData): CallServiceResult => ({
        retCode: ResultCodes.success,
        result: fn(req.args),
    });

export class ServiceError extends Error {
    constructor(message: string) {
        super(message);

        Object.setPrototypeOf(this, ServiceError.prototype);
    }
}
