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
import { SecurityTetraplet, InterpreterOutcome } from './commonTypes';
import { FluenceClientBase } from './FluenceClientBase';
import { FluenceClient } from '../FluenceClient';
import { genUUID, ParticleDto } from './particle';
import { ParticleProcessor } from './ParticleProcessor';
import { ParticleProcessorStrategy } from './ParticleProcessorStrategy';

export class FluenceClientImpl extends FluenceClientBase implements FluenceClient {
    private callbacks: Map<string, Function> = new Map();

    constructor(selfPeerId: PeerId) {
        super(selfPeerId);
        this.processor = new ParticleProcessor(this.strategy, selfPeerId);
    }

    registerCallback(
        serviceId: string,
        fnName: string,
        callback: (args: any[], tetraplets: SecurityTetraplet[][]) => object,
    ) {
        this.callbacks.set(`${serviceId}/${fnName}`, callback);
    }

    unregisterCallback(serviceId: string, fnName: string) {
        this.callbacks.delete(`${serviceId}/${fnName}`);
    }

    protected strategy: ParticleProcessorStrategy = {
        particleHandler: (serviceId: string, fnName: string, args: any[], tetraplets: SecurityTetraplet[][]) => {
            // missing built-in op
            if (serviceId === 'op' && fnName === 'identity') {
                return {
                    ret_code: 0,
                    result: JSON.stringify(args),
                };
            }

            // callback handling
            const eventPair = `${serviceId}/${fnName}`;
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
                ret_code: 1,
                result: `Error. There is no service: ${serviceId}`,
            };
        },

        sendParticleFurther: async (particle: ParticleDto) => {
            try {
                await this.connection.sendParticle(particle);
            } catch (reason) {
                log.error(`Error on sending particle with id ${particle.id}: ${reason}`);
            }
        },

        onParticleTimeout: (particle: ParticleDto, now: number) => {
            log.info(`Particle expired. Now: ${now}, ttl: ${particle.ttl}, ts: ${particle.timestamp}`);
        },
        onLocalParticleRecieved: (particle: ParticleDto) => {
            log.debug('local particle received', particle);
        },
        onExternalParticleRecieved: (particle: ParticleDto) => {
            log.debug('external particle received', particle);
        },
        onInterpreterExecuting: (particle: ParticleDto) => {
            log.debug('interpreter executing particle', particle);
        },
        onInterpreterExecuted: (interpreterOutcome: InterpreterOutcome) => {
            log.debug('inner interpreter outcome:', interpreterOutcome);
        },
    };
}
