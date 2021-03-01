import { of } from 'ipfs-only-hash';
import log from 'loglevel';
import { AquaCallHandler } from './AquaHandler';
import { DEFAULT_TTL, RequestFlow } from './RequestFlow';

export const loadVariablesService = 'load';
const loadVariablesFn = 'load_variable';
export const loadRelayFn = 'load_relay';
const xorHandleService = '__magic';
const xorHandleFn = 'handle_xor';
export const relayVariableName = 'init_relay';

const wrapWithXor = (script: string): string => {
    return `
    (xor
        ${script}
        (xor
            (match ${relayVariableName} ""
                (call %init_peer_id% ("${xorHandleService}" "${xorHandleFn}") [%last_error%])
            )
            (seq 
                (call ${relayVariableName} ("op" "identity") [])
                (call %init_peer_id% ("${xorHandleService}" "${xorHandleFn}") [%last_error%])
            )
        )
    )`;
};

class ScriptBuilder {
    private script: string;

    raw(script: string): ScriptBuilder {
        this.script = script;
        return this;
    }

    build(): string {
        return this.script;
    }
}

const wrapWithVariableInjectionScript = (script: string, fields: string[]): string => {
    fields.forEach((v) => {
        script = `
(seq
    (call %init_peer_id% ("${loadVariablesService}" "${loadVariablesFn}") ["${v}"] ${v})
    ${script}
)`;
    });

    return script;
};

const wrapWithInjectRelayScript = (script: string): string => {
    return `
(seq
    (seq 
        (call %init_peer_id% ("${loadVariablesService}" "${loadRelayFn}") [] ${relayVariableName})
        (call %init_peer_id% ("op" "identity") [%init_peer_id%] init_peer_id)
    )
    ${script}
)`;
};

export class RequestFlowBuilder {
    private ttl: number = DEFAULT_TTL;
    private variables = new Map<string, any>();
    private handlerConfigs: Array<(handler: AquaCallHandler) => void> = [];
    private buildScript: (sb: ScriptBuilder) => void;
    private onTimeout: () => void;
    private onError: (error: any) => void;

    build() {
        if (!this.buildScript) {
            throw new Error();
        }

        const b = new ScriptBuilder();
        this.buildScript(b);
        let script = b.build();
        script = wrapWithVariableInjectionScript(script, Array.from(this.variables.keys()));
        script = wrapWithXor(script);
        script = wrapWithInjectRelayScript(script);

        const res = RequestFlow.createLocal(script, this.ttl);
        res.handler.on(loadVariablesService, loadVariablesFn, (args, _) => {
            return this.variables.get(args[0]) || {};
        });
        res.handler.onEvent(xorHandleService, xorHandleFn, (args) => {
            try {
                const msg = JSON.parse(args[0]);
                res.raiseError(msg);
            } catch (e) {
                log.warn("Error handling script didn't work", e);
            }
        });

        for (let h of this.handlerConfigs) {
            h(res.handler);
        }

        if (this.onTimeout) {
            res.onTimeout(this.onTimeout);
        }
        if (this.onError) {
            res.onError(this.onError);
        }

        return res;
    }

    withScript(action: (sb: ScriptBuilder) => void): RequestFlowBuilder {
        this.buildScript = action;
        return this;
    }

    withRawScript(script: string): RequestFlowBuilder {
        this.buildScript = (sb) => {
            sb.raw(script);
        };
        return this;
    }

    withTTL(ttl: number): RequestFlowBuilder {
        this.ttl = ttl;
        return this;
    }

    handleTimeout(handler: () => void): RequestFlowBuilder {
        this.onTimeout = handler;
        return this;
    }

    handleScriptError(handler: (error) => void): RequestFlowBuilder {
        this.onError = handler;
        return this;
    }

    withVariable(name: string, value: any): RequestFlowBuilder {
        this.variables.set(name, value);
        return this;
    }

    withVariables(data: Map<string, any> | Record<string, any>): RequestFlowBuilder {
        if (data instanceof Map) {
            this.variables = new Map([...Array.from(this.variables.entries()), ...Array.from(data.entries())]);
        } else {
            for (let k in data) {
                this.variables.set(k, data[k]);
            }
        }

        return this;
    }

    buildWithFetchSemantics<T>(
        callbackServiceId: string = 'callback',
        callbackFnName: string = 'callback',
    ): [RequestFlow, Promise<T>] {
        const fetchPromise = new Promise<T>((resolve, reject) => {
            this.handlerConfigs.push((h) => {
                h.onEvent(callbackServiceId, callbackFnName, (args, _) => {
                    resolve(args as any);
                });
            });

            this.handleTimeout(() => {
                reject(`Timed out after ${this.ttl}ms`);
            });

            this.handleScriptError((e) => {
                reject(e);
            });
        });

        return [this.build(), fetchPromise];
    }

    buildWithErrorHandling(): [RequestFlow, Promise<void>] {
        const promise = new Promise<void>((resolve, reject) => {
            this.handleScriptError(reject);
        });

        return [this.build(), promise];
    }

    configHandler(config: (handler: AquaCallHandler) => void): RequestFlowBuilder {
        this.handlerConfigs.push(config);
        return this;
    }
}
