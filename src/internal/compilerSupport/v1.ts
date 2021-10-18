/*
 * Copyright 2021 Fluence Labs Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CallServiceHandler } from './LegacyCallServiceHandler';
import { Particle } from '../Particle';

export { FluencePeer } from '../FluencePeer';
export { CallParams, ResultCodes } from '../commonTypes';

export interface RequestFlow {
    particle: Particle;
    handler: CallServiceHandler;
    timeout?: () => void;
    error?: (reason?: any) => void;
}

const DEFAULT_TTL = 7000;

export class RequestFlowBuilder {
    private _ttl?: number;
    private _script?: string;
    private _configs: any = [];
    private _error: (reason?: any) => void = () => {};
    private _timeout: () => void = () => {};

    build(): RequestFlow {
        let h = new CallServiceHandler();
        for (let c of this._configs) {
            c(h);
        }

        return {
            particle: Particle.createNew(this._script!, this._ttl || DEFAULT_TTL),
            handler: h,
            timeout: this._timeout,
            error: this._error,
        };
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
