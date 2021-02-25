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
    private ttl: number;
    private data = new Map<string, any>();
    private handlerConfig?;
    private buildScript: (sb: ScriptBuilder) => void;

    build() {
        if (!this.buildScript) {
            throw new Error();
        }

        const b = new ScriptBuilder();
        this.buildScript(b);
        const script = b.build();

        const res = RequestFlow.createLocal(script, this.data, this.ttl || DEFAULT_TTL);
        if (this.handlerConfig) {
            this.handlerConfig(res.handler);
        }

        return res;
    }

    withScript(action: (sb: ScriptBuilder) => void): RequestFlowBuilder {
        this.buildScript = action;
        return this;
    }

    withTTL(ttl: number): RequestFlowBuilder {
        this.ttl = ttl;
        return this;
    }

    withVariable(name: string, value: any): RequestFlowBuilder {
        this.data.set(name, value);
        return this;
    }

    withVariables(data: Map<string, any> | Record<string, any>) {
        if (data instanceof Map) {
            this.data = new Map([...Array.from(this.data.entries()), ...Array.from(data.entries())]);
        } else {
            for (let k in data) {
                this.data.set(k, data[k]);
            }
        }
    }

    configHandler(config: (handler: AquaCallHandler) => void): RequestFlowBuilder {
        this.handlerConfig = config;
        return this;
    }
}
