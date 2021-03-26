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
    private isXorInjected: boolean;
    private shouldInjectRelay: boolean;
    private variables?: string[];

    constructor() {
        this.isXorInjected = false;
        this.shouldInjectRelay = false;
    }

    raw(script: string): ScriptBuilder {
        this.script = script;
        return this;
    }

    withInjectedVariables(fields: string[]): ScriptBuilder {
        this.variables = fields;
        return this;
    }

    wrappedWithXor(): ScriptBuilder {
        this.isXorInjected = true;
        return this;
    }

    withInjectedRelay(): ScriptBuilder {
        this.shouldInjectRelay = true;
        return this;
    }

    build(): string {
        let script = this.script;
        if (this.withInjectedVariables && this.withInjectedVariables.length > 0) {
            script = wrapWithVariableInjectionScript(script, this.variables);
        }
        if (this.isXorInjected) {
            script = wrapWithXor(script);
        }
        if (this.shouldInjectRelay) {
            script = wrapWithInjectRelayScript(script);
        }
        return script;
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
    private handlerConfigs: Array<(handler: AquaCallHandler, request: RequestFlow) => void> = [];
    private buildScriptActions: Array<(sb: ScriptBuilder) => void> = [];
    private onTimeout: () => void;
    private onError: (error: any) => void;

    build() {
        const sb = new ScriptBuilder();
        for (let action of this.buildScriptActions) {
            action(sb);
        }
        let script = sb.build();

        const res = RequestFlow.createLocal(script, this.ttl);

        for (let h of this.handlerConfigs) {
            h(res.handler, res);
        }

        if (this.onTimeout) {
            res.onTimeout(this.onTimeout);
        }
        if (this.onError) {
            res.onError(this.onError);
        }

        return res;
    }

    withDefaults(): RequestFlowBuilder {
        this.injectRelay();
        this.injectVariables();
        this.wrapWithXor();

        return this;
    }

    injectRelay(): RequestFlowBuilder {
        this.configureScript((sb) => {
            sb.withInjectedRelay();
        });

        return this;
    }

    injectVariables(): RequestFlowBuilder {
        this.configureScript((sb) => {
            sb.withInjectedVariables(Array.from(this.variables.keys()));
        });

        this.configHandler((h) => {
            h.on(loadVariablesService, loadVariablesFn, (args, _) => {
                return this.variables.get(args[0]) || {};
            });
        });

        return this;
    }

    wrapWithXor(): RequestFlowBuilder {
        this.configureScript((sb) => {
            sb.wrappedWithXor();
        });

        this.configHandler((h, request) => {
            h.onEvent(xorHandleService, xorHandleFn, (args) => {
                let msg;
                try {
                    msg = JSON.parse(args[0]);
                } catch (e) {
                    msg = e;
                }

                try {
                    request.raiseError(msg);
                } catch (e) {
                    log.error('Error handling script executed with error', e);
                }
            });
        });

        return this;
    }

    configureScript(action: (sb: ScriptBuilder) => void): RequestFlowBuilder {
        this.buildScriptActions.push(action);
        return this;
    }

    withRawScript(script: string): RequestFlowBuilder {
        this.buildScriptActions.push((sb) => {
            sb.raw(script);
        });

        return this;
    }

    withTTL(ttl?: number): RequestFlowBuilder {
        if (ttl) {
            this.ttl = ttl;
        }
        return this;
    }

    configHandler(config: (handler: AquaCallHandler, request: RequestFlow) => void): RequestFlowBuilder {
        this.handlerConfigs.push(config);
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

    buildAsFetch<T>(
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
}
