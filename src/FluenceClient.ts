/*
 * Copyright 2020 Fluence Labs Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import log from 'loglevel';
import PeerId from 'peer-id';
import { SecurityTetraplet, StepperOutcome } from './internal/commonTypes';
import { FluenceClientBase } from './internal/FluenceClientBase';
import { Particle } from './internal/particle';
import { ParticleProcessor } from './internal/ParticleProcessor';
import { ParticleProcessorStrategy } from './internal/ParticleProcessorStrategy';

const INFO_LOG_LEVEL = 2;

const fetchCallbackServiceName = '@callback';

export class FluenceClient extends FluenceClientBase {
    private eventSubscribers: Map<string, Function[]> = new Map();
    private eventValidators: Map<string, Function> = new Map();
    private callbacks: Map<string, Function> = new Map();
    private fetchParticles: Map<string, { resolve: Function; reject: Function }> = new Map();

    constructor(selfPeerId: PeerId) {
        super(selfPeerId);
        this.processor = new ParticleProcessor(this.strategy, selfPeerId);
    }

    async fetch<T>(script: string, data: Map<string, any>, ttl?: number): Promise<T> {
        const particleId = await this.sendScript(script, data, ttl);
        return new Promise<T>((resolve, reject) => {
            this.fetchParticles.set(particleId, { resolve, reject });
        });
    }

    registerEvent(
        channel: string,
        eventName: string,
        validate?: (channel: string, eventName: string, args: any[], tetraplets: any[][]) => boolean,
    ) {
        if (!validate) {
            validate = (c, e, a, t) => true;
        }

        this.eventValidators.set(`${channel}/${eventName}`, validate);
    }

    unregisterEvent(channel: string, eventName: string) {
        this.eventValidators.delete(`${channel}/${eventName}`);
    }

    registerCallback(
        serviceId: string,
        fnName: string,
        callback: (args: any[], tetraplets: SecurityTetraplet[][]) => object,
    ) {
        this.callbacks.set(`${serviceId}/${fnName}`, callback);
    }

    unregisterCallback(channel: string, eventName: string) {
        this.eventValidators.delete(`${channel}/${eventName}`);
    }

    subscribe(channel: string, handler: Function) {
        if (!this.eventSubscribers.get(channel)) {
            this.eventSubscribers.set(channel, []);
        }

        this.eventSubscribers.get(channel).push(handler);
    }

    protected strategy: ParticleProcessorStrategy = {
        particleHandler: (serviceId: string, fnName: string, args: any[], tetraplets: SecurityTetraplet[][]) => {
            // async fetch model handling
            if (serviceId === fetchCallbackServiceName) {
                const executingParticle = this.fetchParticles.get(fnName);
                if (executingParticle) {
                    executingParticle.resolve(args);
                    this.fetchParticles.delete(fnName);
                }
            }

            // event model handling
            const eventPair = `${serviceId}/${fnName}`;
            const eventValidator = this.eventValidators.get(eventPair);
            if (eventValidator) {
                try {
                    if (!eventValidator(serviceId, fnName, args, tetraplets)) {
                        return {
                            ret_code: 1, // TODO:: error codes
                            result: 'validation failed',
                        };
                    }
                } catch (e) {
                    log.error('error running validation function: ' + e);
                    return {
                        ret_code: 1, // TODO:: error codes
                        result: 'validation failed',
                    };
                }

                // don't block
                setImmediate(() => {
                    this.pushEvent(serviceId, {
                        type: fnName,
                        args: args,
                    });
                });

                return {
                    ret_code: 0,
                    result: JSON.stringify({}),
                };
            }

            // callback model handling
            const callback = this.callbacks.get(eventPair);
            if (callback) {
                try {
                    const res = callback(args, tetraplets);
                    return {
                        ret_code: 0,
                        result: JSON.stringify(res),
                    };
                } catch (e) {
                    return {
                        ret_code: 1, // TODO:: error codes
                        result: JSON.stringify(e),
                    };
                }
            }

            return {
                ret_code: 0,
                result: `Error. There is no service: ${serviceId}`,
            };
        },

        sendParticleFurther: async (particle: Particle) => {
            try {
                await this.connection.sendParticle(particle);
            } catch (reason) {
                log.error(`Error on sending particle with id ${particle.id}: ${reason}`);
            }
        },

        onParticleTimeout: (particle: Particle, now: number) => {
            const executingParticle = this.fetchParticles.get(particle.id);
            if (executingParticle) {
                executingParticle.reject(new Error(`particle ${particle.id} timed out`));
            }
            log.info(`Particle expired. Now: ${now}, ttl: ${particle.ttl}, ts: ${particle.timestamp}`);
        },
        onLocalParticleRecieved: (particle: Particle) => {},
        onExternalParticleRecieved: (particle: Particle) => {},
        onStepperExecuting: (particle: Particle) => {},
        onStepperExecuted: (stepperOutcome: StepperOutcome) => {
            if (log.getLevel() <= INFO_LOG_LEVEL) {
                log.info('inner interpreter outcome:');
                log.info(stepperOutcome);
            }
        },
    };

    private pushEvent(channel: string, event: any) {
        const subs = this.eventSubscribers.get(channel);
        if (subs) {
            for (let sub of subs) {
                sub(event);
            }
        }
    }
}
