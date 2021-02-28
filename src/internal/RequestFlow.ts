import log, { trace } from 'loglevel';
import PeerId from 'peer-id';
import { AquamarineInterpreter } from './aqua/interpreter';
import { AquaCallHandler } from './AquaHandler';
import { InterpreterOutcome } from './commonTypes';
import { FluenceConnection } from './FluenceConnection';
import { Particle, genUUID, signParticle } from './particle';

export const DEFAULT_TTL = 7000;

export class RequestFlow {
    private state: Particle;
    private prevData: Uint8Array = Buffer.from([]);
    private onTimeoutHandlers = [];
    private onErrorHandlers = [];

    readonly id: string;
    readonly isExternal: boolean;
    readonly script: string;
    readonly handler = new AquaCallHandler();

    ttl: number = DEFAULT_TTL;

    static createExternal(particle: Particle): RequestFlow {
        const res = new RequestFlow(true, particle.id, particle.script);
        res.ttl = particle.ttl;
        res.state = particle;
        setTimeout(res.raiseTimeout.bind(res), particle.ttl);
        return res;
    }

    static createLocal(script: string, ttl?: number): RequestFlow {
        const res = new RequestFlow(false, genUUID(), script);
        res.ttl = ttl ?? DEFAULT_TTL;
        return res;
    }

    constructor(isExternal: boolean, id: string, script: string) {
        this.isExternal = isExternal;
        this.id = id;
        this.script = script;
    }

    onTimeout(handler: () => void) {
        this.onTimeoutHandlers.push(handler);
    }

    onError(handler: (error) => void) {
        this.onErrorHandlers.push(handler);
    }

    async initState(peerId: PeerId): Promise<void> {
        const id = this.id;
        let currentTime = Date.now();

        const particle: Particle = {
            id: id,
            init_peer_id: peerId.toB58String(),
            timestamp: currentTime,
            ttl: this.ttl,
            script: this.script,
            signature: '',
            data: Buffer.from([]),
        };

        particle.signature = await signParticle(peerId, particle);

        this.state = particle;
        setTimeout(this.raiseTimeout.bind(this), particle.ttl);
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

    runInterpreter(interpreter: AquamarineInterpreter) {
        const interpreterOutcomeStr = interpreter.invoke(
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

    raiseError(error) {
        for (const h of this.onErrorHandlers) {
            h(error);
        }
    }

    private raiseTimeout() {
        const now = Date.now();
        const particle = this.state;
        log.info(`Particle expired. Now: ${now}, ttl: ${particle?.ttl}, ts: ${particle?.timestamp}`);

        for (const h of this.onTimeoutHandlers) {
            h();
        }
    }
}
