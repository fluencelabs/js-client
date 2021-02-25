import log, { trace } from 'loglevel';
import PeerId from 'peer-id';
import { InterpreterInvoke } from './aqua/interpreter';
import { AquaCallHandler } from './AquaHandler';
import { InterpreterOutcome } from './commonTypes';
import { FluenceConnection } from './FluenceConnection';
import { Particle, genUUID, signParticle } from './particle';

export const DEFAULT_TTL = 7000;

// HACK:: make an api for aqua interpreter to accept variables in an easy way!
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
    private prevData: Uint8Array = Buffer.from([]);

    readonly id: string;
    readonly isExternal: boolean;
    readonly script: string;
    readonly handler = new AquaCallHandler();

    static createExternal(particle: Particle): RequestFlow {
        const res = new RequestFlow(true, particle.id, particle.script);
        res.ttl = particle.ttl;
        res.state = particle;
        setTimeout(res.raiseTimeout, particle.ttl);
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
        let currentTime = Date.now();

        let data = this.variables;
        if (this.variables === undefined) {
            data = new Map();
        }

        let ttl = this.ttl;
        if (ttl === undefined) {
            ttl = DEFAULT_TTL;
        }

        // HACK:: make an api for aqua interpreter to accept variables in an easy way!
        let script = wrapWithVariableInjectionScript(this.script, Array.from(data.keys()));
        this.handler.on('__magic', 'load', (args, _) => {
            return data ? data.get(args[0]) : {};
        });

        const particle: Particle = {
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
        setTimeout(this.raiseTimeout, particle.ttl);
    }

    receiveUpdate(particle: Particle) {
        // TODO:: keep the history of particle data mb?
        this.prevData = this.state.data;
        this.state.data = particle.data;
    }

    async sendIntoConnection(connection: FluenceConnection): Promise<void> {
        const particle = this.state;
        try {
            await connection.sendParticle(particle);
        } catch (err) {
            log.error(`Error on sending particle with id ${particle.id}: ${err}`);
        }
    }

    runInterpreter(interpreter: InterpreterInvoke) {
        const interpreterOutcomeStr = interpreter(
            this.state.init_peer_id,
            this.state.script,
            this.prevData,
            this.state.data,
        );
        const interpreterOutcome: InterpreterOutcome = JSON.parse(interpreterOutcomeStr);
        // TODO:: keep the history of particle data mb?
        this.state.data = interpreterOutcome.data;
        return interpreterOutcome;
    }

    getParticle = () => this.state;

    getParticleWithoutData(): Omit<Particle, 'data'> {
        const res = { ...this.state };
        delete res.data;
        return res;
    }

    hasExpired(): boolean {
        let now = Date.now();
        const particle = this.getParticle();
        let actualTtl = particle.timestamp + particle.ttl - now;
        return actualTtl <= 0;
    }

    private raiseTimeout() {
        const now = Date.now();
        const particle = this.state;
        log.info(`Particle expired. Now: ${now}, ttl: ${particle.ttl}, ts: ${particle.timestamp}`);

        if (this.onTimeout) {
            this.onTimeout();
        }
    }
}
