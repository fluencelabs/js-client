import { encode, decode } from 'bs58';
import {
    CallServiceData,
    CallServiceHandler,
    CallServiceResult,
    CallServiceResultType,
    Middleware,
} from './CallServiceHandler';
import { errorHandler } from './defaultMiddlewares';

const makeDefaultClientHandler = (): CallServiceHandler => {
    const success = (resp: CallServiceResult, result: CallServiceResultType) => {
        resp.retCode = 0;
        resp.result = result;
    };
    const error = (resp: CallServiceResult, errorMsg: string) => {
        resp.retCode = 1;
        resp.result = errorMsg;
    };
    const mw: Middleware = async (req: CallServiceData, resp: CallServiceResult, next: Function) => {
        if (req.serviceId === 'op') {
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
                    if (req.args.length !== 1) {
                        error(resp, 'string_to_b58 accepts only one string argument');
                    } else {
                        success(resp, encode(new TextEncoder().encode(req.args[0])));
                    }
                    return;

                case 'string_from_b58':
                    if (req.args.length !== 1) {
                        error(resp, 'string_from_b58 accepts only one string argument');
                    } else {
                        success(resp, new TextDecoder().decode(decode(req.args[0])));
                    }
                    return;

                case 'bytes_to_b58':
                    if (req.args.length !== 1 || !Array.isArray(req.args[0])) {
                        error(resp, 'bytes_to_b58 accepts only single argument: array of numbers');
                    } else {
                        const argumentArray = req.args[0] as number[];
                        success(resp, encode(new Uint8Array(argumentArray)));
                    }
                    return;

                case 'bytes_from_b58':
                    if (req.args.length !== 1) {
                        error(resp, 'bytes_from_b58 accepts only one string argument');
                    } else {
                        success(resp, Array.from(decode(req.args[0])));
                    }
                    return;
            }
        }

        await next();
    };

    const res = new CallServiceHandler();
    res.use(errorHandler);
    res.use(mw);
    return res;
};

export default makeDefaultClientHandler;
