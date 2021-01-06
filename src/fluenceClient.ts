import PeerId from 'peer-id';
import { ParticleHandler } from './internal/commonTypes';
import { FluenceClientBase } from './internal/FluenceClientBase';
import { Particle } from './internal/particle';
import { ParticleProcessorStrategy } from './internal/ParticleProcessorStrategy';

// TODO:: tie this together with the class below
class SimpleStrategy extends ParticleProcessorStrategy {
    particleHandler: ParticleHandler;
    sendParticleFurther: (particle: Particle) => void;
    onParticleTimeout?: (particle: Particle) => void;
    onLocalParticleRecieved?: (particle: Particle) => void;
    onExternalParticleRecieved?: (article: Particle) => void;
    onStepperExecuting?: (article: Particle) => void;
    onStepperExecuted?: (article: Particle) => void;
}

export class FluenceClient extends FluenceClientBase {
    private subscribers: Map<string, Function[]> = new Map();

    constructor(selfPeerId: PeerId) {
        super(new SimpleStrategy(), selfPeerId);
    }

    async call<T>(script: string, data: Map<string, any>, ttl?: number): Promise<T> {
        const particleId = this.sendScript(script, data, ttl);
        // register this particleId

        // listen for ack
        return new Promise<T>((resolve, rejects) => {
            // if received "ack" "particle_id"
            // resolve with the result
            // if "particle_id" timed out reject
        });
    }

    registerEvent(channel: string, eventName: string, validate?: (args: any[], tetraplets: any[][]) => boolean) {
        const handler = (eventName: any, args: any[], tetraplets: any[][]) => {
            if (validate && validate(args, tetraplets)) {
                // don't block
                setImmediate(() => {
                    this.pushEvent(channel, {
                        type: eventName,
                        args: args,
                    });
                });
                return {};
            }

            return {
                error: 'something',
            };
        };

        // TODO:: register handler in strategy class
    }

    subscribe(channel: string, handler: Function) {
        if (!this.subscribers.get(channel)) {
            this.subscribers.set(channel, []);
        }

        this.subscribers.get(channel).push(handler);
    }

    private pushEvent(channel: string, event: any) {
        const subs = this.subscribers.get(channel);
        if (subs) {
            for (let sub of subs) {
                sub(event);
            }
        }
    }
}
