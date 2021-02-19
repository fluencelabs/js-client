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
import { instantiateInterpreter, InterpreterInvoke } from './aqua/interpreter';
import { ParticleHandler, SecurityTetraplet, InterpreterOutcome, CallServiceResult } from './commonTypes';
import log from 'loglevel';
import { ParticleProcessorStrategy } from './ParticleProcessorStrategy';
import { RequestFlow, RequestFlowBuilder } from './RequestFlow';
import { AquaCallHandler } from './AquaHandler';

// HACK:: make an api for aqua interpreter to accept variables in an easy way!
let magicParticleStorage: Map<string, Map<string, any>> = new Map();

// HACK:: make an api for aqua interpreter to accept variables in an easy way!
export function injectDataIntoParticle(particleId: string, data: Map<string, any>, ttl: number) {
    log.trace(`setting data for ${particleId}`, data);
    magicParticleStorage.set(particleId, data);
    setTimeout(() => {
        log.trace(`data for ${particleId} is deleted`);
        magicParticleStorage.delete(particleId);
    }, ttl);
}

// HACK:: make an api for aqua interpreter to accept variables in an easy way!
const wrapWithDataInjectionHandling = (
    handler: ParticleHandler,
    getCurrentParticleId: () => string,
): ParticleHandler => {
    return (serviceId: string, fnName: string, args: any[], tetraplets: SecurityTetraplet[][]) => {
        if (serviceId === '__magic' && fnName === 'load') {
            const current = getCurrentParticleId();
            const data = magicParticleStorage.get(current);

            const res = data ? data.get(args[0]) : {};
            return {
                ret_code: 0,
                result: JSON.stringify(res),
            };
        }

        return handler(serviceId, fnName, args, tetraplets);
    };
};

export class ParticleProcessor {
    private interpreter: InterpreterInvoke;
    private requests: Map<string, RequestFlow> = new Map();
    private queue: RequestFlow[] = [];
    private currentRequestId: string | null;

    strategy: ParticleProcessorStrategy;
    peerId: PeerId;
    clientHandler: AquaCallHandler;

    constructor(strategy: ParticleProcessorStrategy, peerId: PeerId, clientHandler: AquaCallHandler) {
        this.strategy = strategy;
        this.peerId = peerId;
        this.clientHandler = clientHandler;
    }

    async init() {
        await this.instantiateInterpreter();
    }

    async destroy() {
        // TODO: destroy interpreter
    }

    async executeLocalParticle(request: RequestFlow) {
        this.requests.set(request.id, request);

        log.debug('local particle received', request.getParticleWithoutData());

        try {
            this.processRequest(request);
        } catch (err) {
            log.error('particle processing failed: ' + err);
        }
    }

    /**
     * Handle incoming particle from a relay.
     */
    async executeExternalParticle(particle: Particle) {
        const toLog = { ...particle };
        delete toLog.data;
        log.debug('external particle received', toLog);

        let data: any = particle.data;
        let error: any = data['protocol!error'];
        if (error !== undefined) {
            log.error('error in external particle: ', error);
            return;
        }

        let request = this.requests.get(particle.id);
        if (request) {
            request.receiveUpdate(particle);
        } else {
            request = RequestFlow.createExternal(particle);
        }
        this.requests.set(request.id, request);

        await this.processRequest(request);
    }

    private getCurrentRequestId(): string | undefined {
        return this.currentRequestId;
    }

    /**
     * Pass a particle to a interpreter and send a result to other services.
     */
    private async processRequest(request: RequestFlow): Promise<void> {
        // enque the request if it's not the currently processed one
        if (this.currentRequestId !== null && this.currentRequestId !== request.id) {
            this.queue.push(request);
            return;
        }

        if (this.interpreter === undefined) {
            throw new Error('Undefined. Interpreter is not initialized');
        }

        // start particle processing if queue is empty
        try {
            this.currentRequestId = request.id;
            // check if a particle is relevant
            let now = Date.now();
            const particle = request.getParticle();
            let actualTtl = particle.timestamp + particle.ttl - now;
            if (actualTtl <= 0) {
                log.info(`Particle expired. Now: ${now}, ttl: ${particle.ttl}, ts: ${particle.timestamp}`);
                request.onTimeout();
                // TODO:: put this behavior under a flag mb?
                // this.requests.delete(request.id);
                return;
            }

            log.debug('interpreter executing particle', request.getParticleWithoutData());
            const interpreterOutcome = request.runInterpreter(this.interpreter);
            log.debug('inner interpreter outcome:', interpreterOutcome);

            // do nothing if there is no `next_peer_pks` or if client isn't connected to the network
            if (interpreterOutcome.next_peer_pks.length > 0) {
                this.strategy.sendParticleFurther(request.getParticle());
            }
        } finally {
            // get last request from the queue
            let nextRequest = this.queue.pop();

            // start the processing of the new request if it exists
            if (nextRequest) {
                // update current particle
                this.currentRequestId = nextRequest.id;

                await this.processRequest(nextRequest);
            } else {
                // wait for a new call (do nothing) if there is no new particle in a queue
                this.currentRequestId = null;
            }
        }
    }

    private theHandler: ParticleHandler = (
        serviceId: string,
        fnName: string,
        args: any[],
        tetraplets: SecurityTetraplet[][],
    ): CallServiceResult => {
        if (this.currentRequestId === null) {
            throw Error('current request can`t be null here');
        }

        const request = this.requests.get(this.currentRequestId);
        return request.handler.execute({
            serviceId,
            fnName,
            args,
            tetraplets,
            particleContext: {
                particleId: request.id,
            },
        });
    };

    /**
     * Instantiate WebAssembly with AIR interpreter to execute AIR scripts
     */
    async instantiateInterpreter() {
        this.interpreter = await instantiateInterpreter(
            wrapWithDataInjectionHandling(this.theHandler.bind(this), this.getCurrentRequestId.bind(this)),
            this.peerId,
        );
    }
}
