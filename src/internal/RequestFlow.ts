import { trace } from 'loglevel';
import PeerId from 'peer-id';
import { AquaCallHandler } from './AquaHandler';
import { Particle, genUUID, signParticle } from './particle';
import { injectDataIntoParticle } from './ParticleProcessor';

const DEFAULT_TTL = 7000;

function wrapWithVariableInjectionScript(script: string, fields: string[]): string {
    fields.forEach((v) => {
        script = `
(seq
    (call %init_peer_id% ("__magic" "load") ["${v}"] ${v})
    ${script}
)
                 `;
    });

    return script;
}

export class RequestFlow {
    private state: Particle;

    readonly id: string;
    readonly isExternal: boolean;
    readonly script: string;
    readonly handler = new AquaCallHandler();

    static createExternal(particle: Particle): RequestFlow {
        const res = new RequestFlow(true, particle.id, particle.script);
        res.ttl = particle.ttl;
        return res;
    }

    static createLocal(script: string, data?: Map<string, any> | Record<string, any>, ttl?: number): RequestFlow {
        const res = new RequestFlow(false, genUUID(), script);

        if (data === undefined) {
            res.variables = new Map();
        } else if (data instanceof Map) {
            res.variables = data;
        } else {
            res.variables = new Map();
            for (let k in data) {
                res.variables.set(k, data[k]);
            }
        }

        res.ttl = ttl ?? DEFAULT_TTL;
        return res;
    }

    constructor(isExternal: boolean, id: string, script: string) {
        this.isExternal = isExternal;
        this.id = id;
        this.script = script;
    }

    variables: Map<string, any> = new Map();
    ttl: number;
    onTimeout?: () => void;

    async initState(peerId: PeerId): Promise<void> {
        const id = this.id;
        let currentTime = new Date().getTime();

        let data = this.variables;
        if (this.variables === undefined) {
            data = new Map();
        }

        let ttl = this.ttl;
        if (ttl === undefined) {
            ttl = DEFAULT_TTL;
        }

        injectDataIntoParticle(id, data, ttl);
        let script = wrapWithVariableInjectionScript(this.script, Array.from(data.keys()));

        let particle: Particle = {
            id: id,
            init_peer_id: peerId.toB58String(),
            timestamp: currentTime,
            ttl: ttl,
            script: script,
            signature: '',
            data: Buffer.from([]),
        };

        particle.signature = await signParticle(peerId, particle);

        this.state = particle;
    }

    async getParticle(peerId: PeerId): Promise<Particle> {
        await this.initState(peerId);
        return this.state;
    }
}

export class RequestFlowBuilder {
    private params: any = {};
    private data = new Map<string, any>();
    private handlerConfig?;

    build() {
        if (!this.params.script) {
            throw new Error();
        }
        const res = new RequestFlow(this.params.script, this.params.data, this.params.ttl);
        if (this.handlerConfig) {
            this.handlerConfig(res.handler);
        }

        return res;
    }

    withScript(script: string): RequestFlowBuilder {
        this.params.script = script;
        return this;
    }

    withTTL(ttl: number): RequestFlowBuilder {
        this.params.ttl = ttl;
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

    configHandler(config: (AquaCallHandler) => void): RequestFlowBuilder {
        this.handlerConfig = config;
        return this;
    }
}
