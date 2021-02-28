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
import { ParticleHandler, SecurityTetraplet, CallServiceResult } from './commonTypes';
import log from 'loglevel';
import { RequestFlow } from './RequestFlow';
import { AquaCallHandler } from './AquaHandler';
import { FluenceConnection } from './FluenceConnection';
import { AquamarineInterpreter } from './aqua/interpreter';

export class ParticleProcessor {
    private readonly peerId: PeerId;
    private readonly clientHandler: AquaCallHandler;

    private connection: FluenceConnection;
    private interpreter: AquamarineInterpreter;
    private requests: Map<string, RequestFlow> = new Map();
    private queue: RequestFlow[] = [];
    private currentRequestId: string | null = null;
    private watchDog;

    constructor(peerId: PeerId, clientHandler: AquaCallHandler) {
        this.peerId = peerId;
        this.clientHandler = clientHandler;
    }

    /**
     * Instantiate WebAssembly with AIR interpreter to execute AIR scripts
     */
    async init(connection?: FluenceConnection) {
        this.connection = connection;
        this.interpreter = await AquamarineInterpreter.create({
            particleHandler: this.hanlder.bind(this),
            peerId: this.peerId,
        });
        this.watchDog = setInterval(() => {
            for (let key in this.requests.keys) {
                if (this.requests.get(key).hasExpired()) {
                    this.requests.delete(key);
                }
            }
        }, 5000);
    }

    async destroy() {
        clearInterval(this.watchDog);
    }

    async executeLocalParticle(request: RequestFlow) {
        request.handler.combineWith(this.clientHandler);
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

        let request = this.requests.get(particle.id);
        if (request) {
            request.receiveUpdate(particle);
        } else {
            request = RequestFlow.createExternal(particle);
            request.handler.combineWith(this.clientHandler);
        }
        this.requests.set(request.id, request);

        await this.processRequest(request);
    }

    private async processRequest(request: RequestFlow): Promise<void> {
        // enque the request if it's not the currently processed one
        if (this.currentRequestId !== null && this.currentRequestId !== request.id) {
            this.queue.push(request);
            return;
        }

        if (this.interpreter === undefined) {
            throw new Error('Undefined. Interpreter is not initialized');
        }

        // start request processing if queue is empty
        try {
            this.currentRequestId = request.id;
            if (request.hasExpired()) {
                return;
            }

            log.debug('interpreter executing particle', request.getParticleWithoutData());
            const interpreterOutcome = request.runInterpreter(this.interpreter);

            log.debug('inner interpreter outcome:', {
                ret_code: interpreterOutcome.ret_code,
                error_message: interpreterOutcome.error_message,
                next_peer_pks: interpreterOutcome.next_peer_pks,
            });

            if (interpreterOutcome.ret_code !== 0) {
                request.raiseError(
                    `Interpreter failed with code=${interpreterOutcome.ret_code} message=${interpreterOutcome.error_message}`,
                );
            }

            // do nothing if there is no `next_peer_pks` or if client isn't connected to the network
            if (interpreterOutcome.next_peer_pks.length > 0) {
                if (!this.connection) {
                    log.error('Cannot send particle: non connected');
                }

                request.sendIntoConnection(this.connection);
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

    private hanlder: ParticleHandler = (
        serviceId: string,
        fnName: string,
        args: any[],
        tetraplets: SecurityTetraplet[][],
    ): CallServiceResult => {
        if (this.currentRequestId === null) {
            throw Error('current request can`t be null here');
        }

        const request = this.requests.get(this.currentRequestId);
        const res = request.handler.execute({
            serviceId,
            fnName,
            args,
            tetraplets,
            particleContext: {
                particleId: request.id,
            },
        });
        return {
            ret_code: res.retCode,
            result: JSON.stringify(res.result || {}),
        };
    };
}
