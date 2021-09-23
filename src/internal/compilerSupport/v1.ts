import { Particle } from '../particle';

export { FluencePeer } from '../FluencePeer';
export { ResultCodes } from '../../internal/CallServiceHandler';
export { CallParams } from '../commonTypes';

export class RequestFlow {
    getParticle(): Particle {
        return new Particle();
    }
}

export class RequestFlowBuilder {
    build(): RequestFlow {
        throw new Error('Method not implemented.');
    }

    withTTL(ttl: any): RequestFlowBuilder {
        throw new Error('Method not implemented.');
        return this;
    }

    handleTimeout(handler: () => void): RequestFlowBuilder {
        throw new Error('Method not implemented.');
        return this;
    }

    handleScriptError(reject: (reason?: any) => void): RequestFlowBuilder {
        throw new Error('Method not implemented.');
        return this;
    }

    withRawScript(script: string): RequestFlowBuilder {
        throw new Error('Method not implemented.');
        return this;
    }

    disableInjections(): RequestFlowBuilder {
        return this;
    }

    configHandler(h) {
        throw new Error('Method not implemented.');
        return this;
    }
}
