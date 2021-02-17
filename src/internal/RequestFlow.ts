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
    readonly id: string;
    readonly script: string;
    readonly data: Map<string, any> = new Map();
    readonly ttl: number;
    readonly handler = new AquaCallHandler();
    readonly onTimeout?: () => void;

    constructor(script: string, data?: Map<string, any> | Record<string, any>, ttl?: number) {
        this.id = genUUID();
        this.script = script;
        if (data === undefined) {
            this.data = new Map();
        } else if (data instanceof Map) {
            this.data = data;
        } else {
            this.data = new Map();
            for (let k in data) {
                this.data.set(k, data[k]);
            }
        }

        this.ttl = ttl ?? DEFAULT_TTL;
    }

    async getParticle(peerId: PeerId): Promise<Particle> {
        const id = this.id;
        let currentTime = new Date().getTime();

        let data = this.data;
        if (this.data === undefined) {
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

        return particle;
    }
}

export class RequestFlowBuilder {
    private params: any = {};
    private data = new Map();
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

    configHandler(config: (AquaCallHandler) => void): RequestFlowBuilder {
        this.handlerConfig = config;
        return this;
    }
}
