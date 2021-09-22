import { InterpreterResult } from '@fluencelabs/avm';
import { Particle } from './particle';

export class ParticleExecFlow {
    private _state: Particle;
    prevData: Uint8Array = Buffer.from([]);
    interpreterResult: InterpreterResult | null = null;

    constructor(particle: Particle) {
        this._state = particle;
    }

    mergeWithIncoming(incoming: Particle) {
        this.prevData = this._state.data;
        this._state.data = incoming.data;
    }

    getParticle = () => this._state;

    hasExpired(): boolean {
        let now = Date.now();
        const particle = this.getParticle();
        let actualTtl = particle.timestamp + particle.ttl - now;
        return actualTtl <= 0;
    }
}
