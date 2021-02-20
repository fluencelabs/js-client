import { CallServiceResult, ErrorCodes } from './commonTypes';

interface ParticleContext {
    particleId?: string;
    [x: string]: any;
}

interface AquaCall {
    serviceId: string;
    fnName: string;
    args: any[];
    tetraplets: any[][];
    particleContext: ParticleContext;
    [x: string]: any;
}

interface AquaResult {
    retCode: ErrorCodes;
    result?: any;
    [x: string]: any;
}

export type Middleware = (req: AquaCall, resp: AquaResult, next: Function) => void;

export const fnHandler = (serviceId: string, fnName: string, handler: (args: any[], tetraplets: any[][]) => any) => {
    return (req: AquaCall, resp: AquaResult, next: Function): void => {
        if (req.fnName === fnName && req.serviceId === serviceId) {
            const res = handler(req.args, req.tetraplets);
            resp.retCode = ErrorCodes.success;
            resp.result = res;
        } else {
            next();
        }
    };
};

export const errorHandler: Middleware = (req: AquaCall, resp: AquaResult, next: Function): void => {
    try {
        next();
    } catch (e) {
        resp.retCode = ErrorCodes.exceptionInHandler;
        resp.result = e.message;
    }
};

type InternalHandler = (req: AquaCall, resp: AquaResult) => void;

export class AquaCallHandler {
    private static defaultHandler(req: AquaCall, resp: AquaResult) {
        resp.retCode = ErrorCodes.noServiceFound;
        resp.result = `Error. There is no service: ${req.serviceId}`;
    }

    middlewares: Middleware[] = [];

    use(middleware: Middleware): AquaCallHandler {
        this.middlewares.push(middleware);
        return this;
    }

    unUse(middleware: Middleware): AquaCallHandler {
        const index = this.middlewares.indexOf(middleware);
        if (index !== -1) {
            this.middlewares.splice(index, 1);
        }
        return this;
    }

    combineWith(other: AquaCallHandler): AquaCallHandler {
        this.middlewares = [...this.middlewares, ...other.middlewares];
        return this;
    }

    on(serviceId: string, fnName: string, handler: (args: any[], tetraplets: any[][]) => any): Function {
        const mw = fnHandler(serviceId, fnName, handler);
        this.use(mw);
        return () => {
            this.unUse(mw);
        };
    }

    buildHanlder(initialHanlder?: InternalHandler): InternalHandler {
        let h: InternalHandler = initialHanlder || AquaCallHandler.defaultHandler;

        for (let mw of this.middlewares) {
            h = (req, resp) => {
                mw(req, resp, () => h(req, resp));
            };
        }

        return h;
    }

    execute(req: AquaCall): CallServiceResult {
        const res: AquaResult = {
            retCode: ErrorCodes.unkownError,
        };
        this.buildHanlder()(req, res);
        return {
            ret_code: res.retCode,
            result: JSON.stringify(res.result || {}),
        };
    }
}
