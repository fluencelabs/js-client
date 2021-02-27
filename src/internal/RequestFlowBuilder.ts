import log from 'loglevel';
import { AquaCallHandler } from './AquaHandler';
import { DEFAULT_TTL, RequestFlow } from './RequestFlow';

const loadVariablesService = 'load_variables';
const loadVariablesFn = 'load';
const xorHandleService = '__magic';
const xorHandleFn = 'handle_xor';
const relay = 'init_peer_relay';

const wrapWithXor = (script: string): string => {
    return `
    (xor
        ${script}
        (seq
            (match ${relay} ''
                (call ${relay} ("op" "identity") [])
            )
            (call %init_peer_id% ("${xorHandleService}" "${xorHandleFn}") [%last_error%])
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
)
                 `;
    });

    return script;
};

export class RequestFlowBuilder {
    private ttl: number = DEFAULT_TTL;
    private variables = new Map<string, any>();
    private handlerConfigs: Array<(handler: AquaCallHandler) => void> = [];
    private buildScript: (sb: ScriptBuilder) => void;
    private onTimeout: () => void;

    build() {
        if (!this.buildScript) {
            throw new Error();
        }

        const b = new ScriptBuilder();
        this.buildScript(b);
        let script = b.build();
        script = wrapWithVariableInjectionScript(script, Array.from(this.variables.keys()));
        script = wrapWithXor(script);

        const res = RequestFlow.createLocal(script, this.ttl);
        res.handler.on(loadVariablesService, loadVariablesFn, (args, _) => {
            return this.variables.get(args[0]) || {};
        });
        res.handler.onEvent(xorHandleService, xorHandleFn, (args) => {
            try {
                const msg = JSON.parse(args[0]);

                if (res.onError) {
                    res.onError(msg);
                }
            } catch (e) {
                log.warn("Error handling script didn't work", e);
            }
        });

        for (let h of this.handlerConfigs) {
            h(res.handler);
        }

        res.onTimeout = this.onTimeout;
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
                reject(new Error(`callback for ${callbackServiceId}/${callbackFnName} timed out after ${this.ttl}`));
            });
        });

        return [this.build(), fetchPromise];
    }

    configHandler(config: (handler: AquaCallHandler) => void): RequestFlowBuilder {
        this.handlerConfigs.push(config);
        return this;
    }
}
