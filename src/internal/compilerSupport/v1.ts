import { CallServiceHandler } from '../../internal/CallServiceHandler';
import { Particle } from '../particle';

export { FluencePeer } from '../FluencePeer';
export { ResultCodes } from '../../internal/CallServiceHandler';
export { CallParams } from '../commonTypes';

export type RequestFlow = Particle;

const DEFAULT_TTL = 7000;

export class RequestFlowBuilder {
    private _ttl?: number;
    private _script?: string;
    private _configs: any = [];
    private _error: (reason?: any) => void = () => {};
    private _timeout: () => void = () => {};

    build(): RequestFlow {
        const res = Particle.createNew(this._script!, this._ttl || DEFAULT_TTL);
        let h = new CallServiceHandler();
        for (let c of this._configs) {
            h = c(h);
        }
        res.meta = {
            handler: h,
            timeout: this._timeout,
            error: this._error,
        };
        return res;
    }

    withTTL(ttl: number): RequestFlowBuilder {
        this._ttl = ttl;
        return this;
    }

    handleTimeout(timeout: () => void): RequestFlowBuilder {
        this._timeout = timeout;
        return this;
    }

    handleScriptError(reject: (reason?: any) => void): RequestFlowBuilder {
        this._error = reject;
        return this;
    }

    withRawScript(script: string): RequestFlowBuilder {
        this._script = script;
        return this;
    }

    disableInjections(): RequestFlowBuilder {
        return this;
    }

    configHandler(h: (handler: CallServiceHandler) => void) {
        this._configs.push(h);
        return this;
    }
}
