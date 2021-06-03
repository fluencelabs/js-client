import { encode, decode } from 'bs58';
import {
    CallServiceData,
    CallServiceHandler,
    CallServiceResult,
    CallServiceResultType,
    errorHandler,
    Middleware,
} from './CallServiceHandler';

const makeDefaultClientHandler = (): CallServiceHandler => {
    const success = (resp: CallServiceResult, result: CallServiceResultType) => {
        resp.retCode = 0;
        resp.result = result;
    };
    const error = (resp: CallServiceResult, errorMsg: string) => {
        resp.retCode = 1;
        resp.result = errorMsg;
    };
    const mw: Middleware = (req: CallServiceData, resp: CallServiceResult, next: Function) => {
        if (req.serviceId === 'Op') {
            switch (req.fnName) {
                case 'noop':
                    success(resp, {});
                    return;

                case 'array':
                    success(resp, req.args);
                    return;

                case 'identity':
                    if (req.args.length > 1) {
                        error(resp, `identity accepts up to 1 arguments, received ${req.args.length} arguments`);
                    } else {
                        success(resp, req.args.length === 0 ? {} : req.args[0]);
                    }
                    return;

                case 'concat':
                    const incorrectArgIndices = req.args //
                        .map((x, i) => [Array.isArray(x), i])
                        .filter(([isArray, _]) => !isArray)
                        .map(([_, index]) => index);

                    if (incorrectArgIndices.length > 0) {
                        const str = incorrectArgIndices.join(', ');
                        error(resp, `All arguments of 'concat' must be arrays: arguments ${str} are not`);
                    } else {
                        success(resp, [].concat.apply([], req.args));
                    }
                    return;

                case 'string_to_b58':
                    return;

                case 'string_from_b58':
                    return;

                case 'bytes_to_b58':
                    success(resp, encode(req.args[0]));
                    return;

                case 'bytes_from_b58':
                    success(resp, decode(req.args[0]));
                    return;

                case 'sha256_string':
                    return;
            }
        }

        next();
    };

    const res = new CallServiceHandler();
    res.use(errorHandler);
    res.use(mw);
    return res;
};

export default makeDefaultClientHandler;
