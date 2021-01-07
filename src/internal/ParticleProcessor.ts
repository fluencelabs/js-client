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

import { Particle } from './particle';
import * as PeerId from 'peer-id';
import { instantiateInterpreter, InterpreterInvoke } from './stepper';
import { StepperOutcome } from './commonTypes';
import log from 'loglevel';
import { ParticleProcessorStrategy } from './ParticleProcessorStrategy';

export class ParticleProcessor {
    private interpreter: InterpreterInvoke;
    private subscriptions: Map<string, Particle> = new Map();
    private particlesQueue: Particle[] = [];
    private currentParticle?: string;

    strategy: ParticleProcessorStrategy;
    peerId: PeerId;

    constructor(strategy: ParticleProcessorStrategy, peerId: PeerId) {
        this.strategy = strategy;
        this.peerId = peerId;
    }

    async init() {
        await this.instantiateInterpreter();
    }

    async destroy() {
        // TODO: destroy interpreter
    }

    async executeLocalParticle(particle: Particle) {
        this.strategy?.onLocalParticleRecieved(particle);
        await this.handleParticle(particle);
    }

    async executeExternalParticle(particle: Particle) {
        this.strategy?.onExternalParticleRecieved(particle);
        await this.handleExternalParticle(particle);
    }

    /*
     * private
     */

    private getCurrentParticleId(): string | undefined {
        return this.currentParticle;
    }

    private setCurrentParticleId(particle: string | undefined) {
        this.currentParticle = particle;
    }

    private enqueueParticle(particle: Particle): void {
        this.particlesQueue.push(particle);
    }

    private popParticle(): Particle | undefined {
        return this.particlesQueue.pop();
    }

    /**
     * Subscriptions will be applied by outside message if id will be the same.
     *
     * @param particle
     * @param ttl time to live, subscription will be deleted after this time
     */
    subscribe(particle: Particle, ttl: number) {
        let self = this;
        setTimeout(() => {
            self.subscriptions.delete(particle.id);
            self.strategy?.onParticleTimeout(particle, Date.now());
        }, ttl);
        this.subscriptions.set(particle.id, particle);
    }

    updateSubscription(particle: Particle): boolean {
        if (this.subscriptions.has(particle.id)) {
            this.subscriptions.set(particle.id, particle);
            return true;
        } else {
            return false;
        }
    }

    getSubscription(id: string): Particle | undefined {
        return this.subscriptions.get(id);
    }

    hasSubscription(particle: Particle): boolean {
        return this.subscriptions.has(particle.id);
    }

    /**
     * Pass a particle to a interpreter and send a result to other services.
     */
    private async handleParticle(particle: Particle): Promise<void> {
        // if a current particle is processing, add new particle to the queue
        if (this.getCurrentParticleId() !== undefined && this.getCurrentParticleId() !== particle.id) {
            this.enqueueParticle(particle);
        } else {
            if (this.interpreter === undefined) {
                throw new Error('Undefined. Interpreter is not initialized');
            }
            // start particle processing if queue is empty
            try {
                this.setCurrentParticleId(particle.id);
                // check if a particle is relevant
                let now = Date.now();
                let actualTtl = particle.timestamp + particle.ttl - now;
                if (actualTtl <= 0) {
                    this.strategy?.onParticleTimeout(particle, now);
                } else {
                    // if there is no subscription yet, previous data is empty
                    let prevData: Uint8Array = Buffer.from([]);
                    let prevParticle = this.getSubscription(particle.id);
                    if (prevParticle) {
                        prevData = prevParticle.data;
                        // update a particle in a subscription
                        this.updateSubscription(particle);
                    } else {
                        // set a particle with actual ttl
                        this.subscribe(particle, actualTtl);
                    }
                    this.strategy.onStepperExecuting(particle);
                    let stepperOutcomeStr = this.interpreter(
                        particle.init_peer_id,
                        particle.script,
                        prevData,
                        particle.data,
                    );
                    let stepperOutcome: StepperOutcome = JSON.parse(stepperOutcomeStr);

                    // update data after aquamarine execution
                    let newParticle: Particle = { ...particle, data: stepperOutcome.data };
                    this.strategy.onStepperExecuted(stepperOutcome);

                    this.updateSubscription(newParticle);

                    // do nothing if there is no `next_peer_pks` or if client isn't connected to the network
                    if (stepperOutcome.next_peer_pks.length > 0) {
                        this.strategy.sendParticleFurther(particle);
                    }
                }
            } finally {
                // get last particle from the queue
                let nextParticle = this.popParticle();
                // start the processing of a new particle if it exists
                if (nextParticle) {
                    // update current particle
                    this.setCurrentParticleId(nextParticle.id);
                    await this.handleParticle(nextParticle);
                } else {
                    // wait for a new call (do nothing) if there is no new particle in a queue
                    this.setCurrentParticleId(undefined);
                }
            }
        }
    }

    /**
     * Handle incoming particle from a relay.
     */
    private async handleExternalParticle(particle: Particle): Promise<void> {
        let data: any = particle.data;
        let error: any = data['protocol!error'];
        if (error !== undefined) {
            log.error('error in external particle: ');
            log.error(error);
        } else {
            log.info('handle external particle: ');
            log.info(particle);
            await this.handleParticle(particle);
        }
    }

    /**
     * Instantiate WebAssembly with AIR interpreter to execute AIR scripts
     */
    async instantiateInterpreter() {
        this.interpreter = await instantiateInterpreter(this.strategy.particleHandler, this.peerId);
    }
}
