/*
 * Copyright 2021 Fluence Labs Limited
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
import { KeyPair } from '../keypair/index.js';

import type { PeerIdB58 } from '@fluencelabs/interfaces';
import { deserializeAvmResult, InterpreterResult, KeyPairFormat, serializeAvmArgs } from '@fluencelabs/avm';
import {
    cloneWithNewData,
    getActualTTL,
    hasExpired,
    Particle,
    ParticleExecutionStage,
    ParticleQueueItem,
} from '../particle/Particle.js';
import { defaultCallParameters } from "@fluencelabs/marine-js/dist/types"
import { jsonify, isString } from '../util/utils.js';
import { concatMap, filter, pipe, Subject, tap, Unsubscribable } from 'rxjs';
import { defaultSigGuard, Sig } from '../services/Sig.js';
import { registerSig } from '../services/_aqua/services.js';
import { registerSrv } from '../services/_aqua/single-module-srv.js';
import { registerTracing } from '../services/_aqua/tracing.js';
import { Buffer } from 'buffer';

import { Srv } from '../services/SingleModuleSrv.js';
import { Tracing } from '../services/Tracing.js';

import { logger } from '../util/logger.js';
import { getParticleContext, registerDefaultServices, ServiceError } from '../jsServiceHost/serviceUtils.js';
import { IParticle } from '../particle/interfaces.js';
import { IConnection } from '../connection/interfaces.js';
import { IAvmRunner, IMarineHost } from '../marine/interfaces.js';
import {
    CallServiceData,
    CallServiceResult,
    GenericCallServiceHandler,
    IJsServiceHost,
    ResultCodes,
} from '../jsServiceHost/interfaces.js';
import { JSONValue } from '../util/commonTypes.js';

const log_particle = logger('particle');
const log_peer = logger('peer');

export type PeerConfig = {
    /**
     * Sets the default TTL for all particles originating from the peer with no TTL specified.
     * If the originating particle's TTL is defined then that value will be used
     * If the option is not set default TTL will be 7000
     */
    defaultTtlMs: number;

    /**
     * Enables\disabled various debugging features
     */
    debug: {
        /**
         * If set to true, newly initiated particle ids will be printed to console.
         * Useful to see what particle id is responsible for aqua function
         */
        printParticleId: boolean;
    };
};

export const DEFAULT_CONFIG: PeerConfig = {
    debug: {
        printParticleId: false,
    },
    defaultTtlMs: 7000,
};

/**
 * This class implements the Fluence protocol for javascript-based environments.
 * It provides all the necessary features to communicate with Fluence network
 */
export abstract class FluencePeer {
    constructor(
        protected readonly config: PeerConfig,
        public readonly keyPair: KeyPair,
        protected readonly marineHost: IMarineHost,
        protected readonly jsServiceHost: IJsServiceHost,
        protected readonly connection: IConnection,
    ) {
        this._initServices();
    }

    async start(): Promise<void> {
        log_peer.trace('starting Fluence peer');
        if (this.config?.debug?.printParticleId) {
            this.printParticleId = true;
        }
        await this.marineHost.start();

        this._startParticleProcessing();
        this.isInitialized = true;
        log_peer.trace('started Fluence peer');
    }

    /**
     * Un-initializes the peer: stops all the underlying workflows, stops the Aqua VM
     * and disconnects from the Fluence network
     */
    async stop() {
        log_peer.trace('stopping Fluence peer');
        this._particleSourceSubscription?.unsubscribe();
        this._stopParticleProcessing();
        await this.marineHost.stop();

        this.isInitialized = false;
        log_peer.trace('stopped Fluence peer');
    }

    /**
     * Registers marine service within the Fluence peer from wasm file.
     * Following helper functions can be used to load wasm files:
     * * loadWasmFromFileSystem
     * * loadWasmFromNpmPackage
     * * loadWasmFromServer
     * @param wasm - buffer with the wasm file for service
     * @param serviceId - the service id by which the service can be accessed in aqua
     */
    async registerMarineService(wasm: SharedArrayBuffer | Buffer, serviceId: string): Promise<void> {
        if (!this.marineHost) {
            throw new Error("Can't register marine service: peer is not initialized");
        }

        if (this.jsServiceHost.hasService(serviceId)) {
            throw new Error(`Service with '${serviceId}' id already exists`);
        }

        await this.marineHost.createService(wasm, serviceId);
    }

    /**
     * Removes the specified marine service from the Fluence peer
     * @param serviceId - the service id to remove
     */
    async removeMarineService(serviceId: string): Promise<void> {
        await this.marineHost.removeService(serviceId);
    }

    // internal api

    /**
     * @private Is not intended to be used manually. Subject to change
     */
    get internals() {
        return {
            getServices: () => this._classServices,

            getRelayPeerId: () => {
                if (this.connection.supportsRelay()) {
                    return this.connection.getRelayPeerId();
                }

                throw new Error('Relay is not supported by the current connection');
            },

            parseAst: async (air: string): Promise<{ success: boolean; data: any }> => {
                if (!this.isInitialized) {
                    new Error("Can't use avm: peer is not initialized");
                }

                const res = await this.marineHost.callService('avm', 'ast', [air], defaultCallParameters);
                if (!isString(res)) {
                    throw new Error(`Call to avm:ast expected to return string. Actual return: ${res}`);
                }

                try {
                    if (res.startsWith('error')) {
                        return {
                            success: false,
                            data: res,
                        };
                    } else {
                        return {
                            success: true,
                            data: JSON.parse(res),
                        };
                    }
                } catch (err) {
                    throw new Error('Failed to call avm. Result: ' + res + '. Error: ' + err);
                }
            },

            createNewParticle: (script: string, ttl: number = this.config.defaultTtlMs): IParticle => {
                return Particle.createNew(script, this.keyPair.getPeerId(), ttl);
            },

            /**
             * Initiates a new particle execution starting from local peer
             * @param particle - particle to start execution of
             */
            initiateParticle: (particle: IParticle, onStageChange: (stage: ParticleExecutionStage) => void): void => {
                if (!this.isInitialized) {
                    throw new Error('Cannot initiate new particle: peer is not initialized');
                }

                if (this.printParticleId) {
                    console.log('Particle id: ', particle.id);
                }

                this._incomingParticles.next({
                    particle: particle,
                    callResults: [],
                    onStageChange: onStageChange,
                });
            },

            /**
             * Register Call Service handler functions
             */
            regHandler: {
                /**
                 * Register handler for all particles
                 */
                common: this.jsServiceHost.registerGlobalHandler.bind(this.jsServiceHost),
                /**
                 * Register handler which will be called only for particle with the specific id
                 */
                forParticle: this.jsServiceHost.registerParticleScopeHandler.bind(this.jsServiceHost),
            },
        };
    }

    // Queues for incoming and outgoing particles

    private _incomingParticles = new Subject<ParticleQueueItem>();
    private _outgoingParticles = new Subject<ParticleQueueItem & { nextPeerIds: PeerIdB58[] }>();
    private _timeouts: Array<NodeJS.Timeout> = [];
    private _particleSourceSubscription?: Unsubscribable;
    private _particleQueues = new Map<string, Subject<ParticleQueueItem>>();

    // Internal peer state

    // @ts-expect-error - initialized in constructor through `_initServices` call
    private _classServices: {
        sig: Sig;
        srv: Srv;
        tracing: Tracing;
    };

    private isInitialized = false;
    private printParticleId = false;

    private _initServices() {
        this._classServices = {
            sig: new Sig(this.keyPair),
            srv: new Srv(this),
            tracing: new Tracing(),
        };

        const peerId = this.keyPair.getPeerId();

        registerDefaultServices(this);

        this._classServices.sig.securityGuard = defaultSigGuard(peerId);
        registerSig(this, 'sig', this._classServices.sig);
        registerSig(this, peerId, this._classServices.sig);
        registerSrv(this, 'single_module_srv', this._classServices.srv);
        registerTracing(this, 'tracingSrv', this._classServices.tracing);
    }

    private _startParticleProcessing() {
        this._particleSourceSubscription = this.connection.particleSource.subscribe({
            next: (p) => {
                this._incomingParticles.next({ particle: p, callResults: [], onStageChange: () => {} });
            },
        });

        this._incomingParticles
            .pipe(
                tap((item) => {
                    log_particle.debug('id %s. received:', item.particle.id);
                    log_particle.trace('id %s. data: %j', item.particle.id, {
                        initPeerId: item.particle.initPeerId,
                        timestamp: item.particle.timestamp,
                        ttl: item.particle.ttl,
                        signature: item.particle.signature,
                    });

                    log_particle.trace('id %s. script: %s', item.particle.id, item.particle.script);
                    log_particle.trace('id %s. call results: %j', item.particle.id, item.callResults);
                }),
                filterExpiredParticles(this._expireParticle.bind(this)),
            )
            .subscribe((item) => {
                const p = item.particle;
                let particlesQueue = this._particleQueues.get(p.id);

                if (!particlesQueue) {
                    particlesQueue = this._createParticlesProcessingQueue();
                    this._particleQueues.set(p.id, particlesQueue);

                    const timeout = setTimeout(() => {
                        this._expireParticle(item);
                    }, getActualTTL(p));

                    this._timeouts.push(timeout);
                }

                particlesQueue.next(item);
            });

        this._outgoingParticles.subscribe((item) => {
            // Do not send particle after the peer has been stopped
            if (!this.isInitialized) {
                return;
            }

            log_particle.debug(
                'id %s. sending particle into network. Next peer ids: %s',
                item.particle.id,
                item.nextPeerIds.toString(),
            );

            this.connection
                ?.sendParticle(item.nextPeerIds, item.particle)
                .then(() => {
                    item.onStageChange({ stage: 'sent' });
                })
                .catch((e: any) => {
                    log_particle.error('id %s. send failed %j', item.particle.id, e);
                    item.onStageChange({ stage: 'sendingError', errorMessage: e.toString() });
                });
        });
    }

    private _expireParticle(item: ParticleQueueItem) {
        const particleId = item.particle.id;
        log_particle.debug(
            'id %s. particle has expired after %d. Deleting particle-related queues and handlers',
            item.particle.id,
            item.particle.ttl,
        );

        this._particleQueues.delete(particleId);
        this.jsServiceHost.removeParticleScopeHandlers(particleId);

        item.onStageChange({ stage: 'expired' });
    }
    
    private decodeAvmData(data: Uint8Array) {
        return new TextDecoder().decode(data.buffer);
    }

    private _createParticlesProcessingQueue() {
        const particlesQueue = new Subject<ParticleQueueItem>();
        let prevData: Uint8Array = Buffer.from([]);

        particlesQueue
            .pipe(
                filterExpiredParticles(this._expireParticle.bind(this)),

                concatMap(async (item) => {
                    if (!this.isInitialized || this.marineHost === undefined) {
                        // If `.stop()` was called return null to stop particle processing immediately
                        return null;
                    }

                    // IMPORTANT!
                    // AVM runner execution and prevData <-> newData swapping
                    // MUST happen sequentially (in a critical section).
                    // Otherwise the race might occur corrupting the prevData

                    log_particle.debug('id %s. sending particle to interpreter', item.particle.id);
                    log_particle.trace('id %s. prevData: %s', item.particle.id, this.decodeAvmData(prevData));

                    const args = serializeAvmArgs(
                        {
                            initPeerId: item.particle.initPeerId,
                            currentPeerId: this.keyPair.getPeerId(),
                            timestamp: item.particle.timestamp,
                            ttl: item.particle.ttl,
                            keyFormat: KeyPairFormat.Ed25519,
                            particleId: item.particle.id,
                            secretKeyBytes: this.keyPair.toEd25519PrivateKey(),
                        },
                        item.particle.script,
                        prevData,
                        item.particle.data,
                        item.callResults,
                    );

                    let avmCallResult: InterpreterResult | Error;
                    try {
                        const res = await this.marineHost.callService('avm', 'invoke', args, defaultCallParameters);
                        avmCallResult = deserializeAvmResult(res);
                    } catch (e) {
                        avmCallResult = e instanceof Error ? e : new Error(String(e));
                    }

                    if (!(avmCallResult instanceof Error) && avmCallResult.retCode === 0) {
                        const newData = Buffer.from(avmCallResult.data);
                        prevData = newData;
                    }

                    return {
                        ...item,
                        result: avmCallResult,
                    };
                }),
            )
            .subscribe((item) => {
                // If peer was stopped, do not proceed further
                if (item === null || !this.isInitialized) {
                    return;
                }

                // Do not proceed further if the particle is expired
                if (hasExpired(item.particle)) {
                    return;
                }

                // Do not continue if there was an error in particle interpretation
                if (item.result instanceof Error) {
                    log_particle.error('id %s. interpreter failed: %s', item.particle.id, item.result.message);
                    item.onStageChange({ stage: 'interpreterError', errorMessage: item.result.message });
                    return;
                }

                if (item.result.retCode !== 0) {
                    log_particle.error(
                        'id %s. interpreter failed: retCode: %d, message: %s',
                        item.particle.id,
                        item.result.retCode,
                        item.result.errorMessage,
                    );
                    log_particle.trace('id %s. avm data: %s', item.particle.id, this.decodeAvmData(item.result.data));
                    item.onStageChange({ stage: 'interpreterError', errorMessage: item.result.errorMessage });
                    return;
                }

                log_particle.trace(
                    'id %s. interpreter result: retCode: %d, avm data: %s',
                    item.particle.id,
                    item.result.retCode,
                    this.decodeAvmData(item.result.data)
                );

                setTimeout(() => {
                    item.onStageChange({ stage: 'interpreted' });
                }, 0);

                // send particle further if requested
                if (item.result.nextPeerPks.length > 0) {
                    const newParticle = cloneWithNewData(item.particle, Buffer.from(item.result.data));
                    this._outgoingParticles.next({
                        ...item,
                        particle: newParticle,
                        nextPeerIds: item.result.nextPeerPks,
                    });
                }

                // execute call requests if needed
                // and put particle with the results back to queue
                if (item.result.callRequests.length > 0) {
                    for (const [key, cr] of item.result.callRequests) {
                        const req = {
                            fnName: cr.functionName,
                            args: cr.arguments,
                            serviceId: cr.serviceId,
                            tetraplets: cr.tetraplets,
                            particleContext: getParticleContext(item.particle),
                        };

                        if (hasExpired(item.particle)) {
                            // just in case do not call any services if the particle is already expired
                            return;
                        }
                        this._execSingleCallRequest(req)
                            .catch((err): CallServiceResult => {
                                if (err instanceof ServiceError) {
                                    return {
                                        retCode: ResultCodes.error,
                                        result: err.message,
                                    };
                                }

                                return {
                                    retCode: ResultCodes.error,
                                    result: `Service call failed. fnName="${req.fnName}" serviceId="${
                                        req.serviceId
                                    }" error: ${err.toString()}`,
                                };
                            })
                            .then((res) => {
                                const serviceResult = {
                                    result: jsonify(res.result),
                                    retCode: res.retCode,
                                };

                                const newParticle = cloneWithNewData(item.particle, Buffer.from([]));
                                particlesQueue.next({
                                    ...item,
                                    particle: newParticle,
                                    callResults: [[key, serviceResult]],
                                });
                            });
                    }
                } else {
                    item.onStageChange({ stage: 'localWorkDone' });
                }
            });

        return particlesQueue;
    }

    private async _execSingleCallRequest(req: CallServiceData): Promise<CallServiceResult> {
        const particleId = req.particleContext.particleId;
        log_particle.trace('id %s. executing call service handler %j', particleId, req);

        if (this.marineHost && await this.marineHost.hasService(req.serviceId)) {
            // TODO build correct CallParameters instead of default ones
            const result = await this.marineHost.callService(req.serviceId, req.fnName, req.args, defaultCallParameters);

            return {
                retCode: ResultCodes.success,
                result: result as JSONValue,
            };
        }

        let res = await this.jsServiceHost.callService(req);

        if (res === null) {
            res = {
                retCode: ResultCodes.error,
                result: `No service found for service call: serviceId='${req.serviceId}', fnName='${
                    req.fnName
                }' args='${jsonify(req.args)}'`,
            };
        }

        log_particle.trace('id %s. executed call service handler, req: %j, res: %j ', particleId, req, res);
        return res;
    }

    private _stopParticleProcessing() {
        // do not hang if the peer has been stopped while some of the timeouts are still being executed
        this._timeouts.forEach((timeout) => {
            clearTimeout(timeout);
        });
        this._particleQueues.clear();
    }
}

function filterExpiredParticles(onParticleExpiration: (item: ParticleQueueItem) => void) {
    return pipe(
        tap((item: ParticleQueueItem) => {
            if (hasExpired(item.particle)) {
                onParticleExpiration(item);
            }
        }),
        filter((x: ParticleQueueItem) => !hasExpired(x.particle)),
    );
}
