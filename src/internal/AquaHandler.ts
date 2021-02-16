import { CallServiceResult } from './commonTypes';

interface AquaCall {
    serviceId: string;
    fnName: string;
    args: any[];
    tetraplets: any[][];
    particleContext: Record<string, any>;
}

type AquaResult = {
    retCode: number;
    result?: any;
};

export type Middleware = (req: AquaCall, resp: AquaResult, next: Function) => void;

export const fnHandler = (serviceId: string, fnName: string, handler: (args: any[], tetraplets: any[][]) => any) => {
    return (req: AquaCall, resp: AquaResult, next: Function): void => {
        if (req.fnName === fnName && req.serviceId === serviceId) {
            const res = handler(req.args, req.tetraplets);
            resp.retCode = 0;
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
        resp.retCode = 2;
        resp.result = e.message;
    }
};

type InternalHandler = (req: AquaCall, resp: AquaResult) => void;

export class AquaCallHandler {
    private static defaultHandler(req: AquaCall, resp: AquaResult) {
        resp.retCode = -1;
        resp.result = 'Something went wrong';
    }

    middlewares: Middleware[] = [];

    use(middleware: Middleware): AquaCallHandler {
        this.middlewares.push(middleware);
        return this;
    }

    combine(other: AquaCallHandler): AquaCallHandler {
        this.middlewares = [...this.middlewares, ...other.middlewares];
        return this;
    }

    on(serviceId: string, fnName: string, handler: (args: any[], tetraplets: any[][]) => any): AquaCallHandler {
        return this.use(fnHandler(serviceId, fnName, handler));
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
            retCode: 1,
        };
        this.buildHanlder()(req, res);
        return {
            ret_code: res.retCode,
            result: JSON.stringify(res.result || {}),
        };
    }
}
