import { AquaCallHandler } from './AquaHandler';
import { DEFAULT_TTL, RequestFlow } from './RequestFlow';

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

export class RequestFlowBuilder {
    private ttl: number = DEFAULT_TTL;
    private data = new Map<string, any>();
    private handlerConfigs: Array<(handler: AquaCallHandler) => void> = [];
    private buildScript: (sb: ScriptBuilder) => void;
    private onTimeout: () => void;

    build() {
        if (!this.buildScript) {
            throw new Error();
        }

        const b = new ScriptBuilder();
        this.buildScript(b);
        const script = b.build();

        const res = RequestFlow.createLocal(script, this.data, this.ttl);
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
        this.data.set(name, value);
        return this;
    }

    withVariables(data: Map<string, any> | Record<string, any>): RequestFlowBuilder {
        if (data instanceof Map) {
            this.data = new Map([...Array.from(this.data.entries()), ...Array.from(data.entries())]);
        } else {
            for (let k in data) {
                this.data.set(k, data[k]);
            }
        }

        return this;
    }

    buildWithFetchSemantics<T>(
        callbackFnName: string = 'callback',
        callbackServiceId: string = 'callback',
    ): [RequestFlow, Promise<T>] {
        const fetchPromise = new Promise<T>((resolve, reject) => {
            this.handlerConfigs.push((h) => {
                h.onEvent(callbackFnName, callbackServiceId, (args, _) => {
                    console.log('wewqewqe', args);
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
