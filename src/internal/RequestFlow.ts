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
    script: string;
    data: Map<string, any> = new Map();
    ttl: number;
    handler = new AquaCallHandler();
    onTimeout?: () => void;

    constructor(script: string, data?: Map<string, any> | Record<string, any>, ttl?: number) {
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

    async getParticle(peerId: PeerId, customId?: string): Promise<Particle> {
        const id = customId ?? genUUID();
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
    private item: RequestFlow;

    build() {
        return RequestFlow;
    }

    withScript(script: string): RequestFlowBuilder {
        this.item.script = script;
        return this;
    }

    withTTL(ttl: number): RequestFlowBuilder {
        this.item.ttl = ttl;
        return this;
    }

    withVariable(name: string, value: any): RequestFlowBuilder {
        this.item.data.set(name, value);
        return this;
    }

    configHandler(config: (AquaCallHandler) => void): RequestFlowBuilder {
        config(this.item.handler);
        return this;
    }
}
