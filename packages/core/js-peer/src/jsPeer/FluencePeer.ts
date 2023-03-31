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
import 'buffer';

import { KeyPair } from '../keypair/index.js';

import type { PeerIdB58 } from '@fluencelabs/interfaces';
import {
    cloneWithNewData,
    getActualTTL,
    hasExpired,
    Particle,
    ParticleExecutionStage,
    ParticleQueueItem,
} from '../particle/Particle.js';
import { jsonify, isString } from '../util/utils.js';
import { concatMap, filter, pipe, Subject, tap, Unsubscribable } from 'rxjs';
import { builtInServices } from '../services/builtins.js';
import { defaultSigGuard, Sig } from '../services/Sig.js';
import { registerSig } from '../services/_aqua/services.js';
import { registerSrv } from '../services/_aqua/single-module-srv.js';
import { Buffer } from 'buffer';

import { NodeUtils, Srv } from '../services/SingleModuleSrv.js';
import { registerNodeUtils } from '../services/_aqua/node-utils.js';

import { logger } from '../util/logger.js';
import { getParticleContext, ServiceError } from '../jsServiceHost/serviceUtils.js';
import { IParticle } from '../particle/interfaces.js';
import { IConnection } from '../connection/interfaces.js';
import { IAvmRunner, IMarineHost } from '../marine/interfaces.js';
import {
    CallServiceData,
    CallServiceResult,
    GenericCallServiceHandler,
    ResultCodes,
} from '../jsServiceHost/interface.js';
import { JSONValue } from '../util/commonTypes.js';

const log = logger('particle');

const DEFAULT_TTL = 7000;

export type PeerConfig = {
    /**
     * Sets the default TTL for all particles originating from the peer with no TTL specified.
     * If the originating particle's TTL is defined then that value will be used
     * If the option is not set default TTL will be 7000
     */
    defaultTtlMs?: number;

    /**
     * Enables\disabled various debugging features
     */
    debug?: {
        /**
         * If set to true, newly initiated particle ids will be printed to console.
         * Useful to see what particle id is responsible for aqua function
         */
        printParticleId?: boolean;
    };
};

/**
 * This class implements the Fluence protocol for javascript-based environments.
 * It provides all the necessary features to communicate with Fluence network
 */
export abstract class FluencePeer {
    constructor(
        protected readonly config: PeerConfig,
        public readonly keyPair: KeyPair,
        protected readonly marine: IMarineHost,
        protected readonly avmRunner: IAvmRunner,
        protected readonly connection: IConnection,
    ) {
        this.defaultTTL = this.config?.defaultTtlMs ?? DEFAULT_TTL;
    }

    /**
     * Internal contract to cast unknown objects to IFluenceClient.
     * If an unknown object has this property then we assume it is in fact a Peer and it implements IFluenceClient
     * Check against this variable MUST NOT be coupled with any `FluencePeer` because otherwise it might get bundled
     * brining a lot of unnecessary stuff alongside with it
     */
    __isFluenceAwesome = true;

    public readonly defaultTTL: number;

    async start(): Promise<void> {
        const peerId = this.keyPair.getPeerId();

        if (this.config?.debug?.printParticleId) {
            this.printParticleId = true;
        }

        await this.marine.start();
        await this.avmRunner.start();

        registerDefaultServices(this);

        this._classServices = {
            sig: new Sig(this.keyPair),
            srv: new Srv(this),
        };
        this._classServices.sig.securityGuard = defaultSigGuard(peerId);
        registerSig(this, 'sig', this._classServices.sig);
        registerSig(this, peerId, this._classServices.sig);

        registerSrv(this, 'single_module_srv', this._classServices.srv);
        registerNodeUtils(this, 'node_utils', new NodeUtils(this));

        this.particleSourceSubscription = this.connection.particleSource.subscribe({
            next: (p) => {
                this._incomingParticles.next({ particle: p, callResults: [], onStageChange: () => {} });
            },
        });

        this._startParticleProcessing();
        this.isInitialized = true;
    }

    /**
     * Un-initializes the peer: stops all the underlying workflows, stops the Aqua VM
     * and disconnects from the Fluence network
     */
    async stop() {
        this.particleSourceSubscription?.unsubscribe();
        this._stopParticleProcessing();
        await this.marine.stop();
        await this.avmRunner.stop();
        this._classServices = undefined;

        this._particleSpecificHandlers.clear();
        this._commonHandlers.clear();
        this._marineServices.clear();
        this.isInitialized = false;
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
        if (!this.marine) {
            throw new Error("Can't register marine service: peer is not initialized");
        }
        if (this._containsService(serviceId)) {
            throw new Error(`Service with '${serviceId}' id already exists`);
        }

        await this.marine.createService(wasm, serviceId);
        this._marineServices.add(serviceId);
    }

    /**
     * Removes the specified marine service from the Fluence peer
     * @param serviceId - the service id to remove
     */
    removeMarineService(serviceId: string): void {
        this._marineServices.delete(serviceId);
    }

    /**
     * Creates a new particle originating from the local peer
     * @param script - particle's air script
     * @param ttl  - particle's time to live
     * @returns new particle
     */
    createNewParticle(script: string, ttl: number = this.defaultTTL): Particle {
        return Particle.createNew(script, this.keyPair.getPeerId(), ttl);
    }

    // internal api

    /**
     * @private Is not intended to be used manually. Subject to change
     */
    get internals() {
        return {
            getServices: () => this._classServices!,

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

                const res = await this.marine.callService('avm', 'ast', [air], undefined);
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

            createNewParticle: (script: string, ttl: number = this.defaultTTL): IParticle => {
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
                common: (
                    // force new line
                    serviceId: string,
                    fnName: string,
                    handler: GenericCallServiceHandler,
                ) => {
                    this._commonHandlers.set(serviceFnKey(serviceId, fnName), handler);
                },
                /**
                 * Register handler which will be called only for particle with the specific id
                 */
                forParticle: (
                    particleId: string,
                    serviceId: string,
                    fnName: string,
                    handler: GenericCallServiceHandler,
                ) => {
                    let psh = this._particleSpecificHandlers.get(particleId);
                    if (psh === undefined) {
                        psh = new Map<string, GenericCallServiceHandler>();
                        this._particleSpecificHandlers.set(particleId, psh);
                    }

                    psh.set(serviceFnKey(serviceId, fnName), handler);
                },
            },
        };
    }

    // Queues for incoming and outgoing particles

    private _incomingParticles = new Subject<ParticleQueueItem>();
    private _outgoingParticles = new Subject<ParticleQueueItem & { nextPeerIds: PeerIdB58[] }>();

    // Call service handler

    private _marineServices = new Set<string>();
    private _particleSpecificHandlers = new Map<string, Map<string, GenericCallServiceHandler>>();
    private _commonHandlers = new Map<string, GenericCallServiceHandler>();

    private _classServices?: {
        sig: Sig;
        srv: Srv;
    };

    private _containsService(serviceId: string): boolean {
        return this._marineServices.has(serviceId) || this._commonHandlers.has(serviceId);
    }

    // Internal peer state

    private isInitialized = false;
    private printParticleId = false;
    private timeouts: Array<NodeJS.Timeout> = [];
    private particleSourceSubscription?: Unsubscribable;
    private particleQueues = new Map<string, Subject<ParticleQueueItem>>();

    private _startParticleProcessing() {
        this._incomingParticles
            .pipe(
                tap((item) => {
                    log.debug('id %s. received:', item.particle.id);
                    log.trace('id %s. data: %j', item.particle.id, {
                        initPeerId: item.particle.initPeerId,
                        timestamp: item.particle.timestamp,
                        tttl: item.particle.ttl,
                        signature: item.particle.signature,
                    });

                    log.trace('id %s. script: %s', item.particle.id, item.particle.script);
                    log.trace('id %s. call results: %j', item.particle.id, item.callResults);
                }),
                filterExpiredParticles(this._expireParticle.bind(this)),
            )
            .subscribe((item) => {
                const p = item.particle;
                let particlesQueue = this.particleQueues.get(p.id);

                if (!particlesQueue) {
                    particlesQueue = this._createParticlesProcessingQueue();
                    this.particleQueues.set(p.id, particlesQueue);

                    const timeout = setTimeout(() => {
                        this._expireParticle(item);
                    }, getActualTTL(p));

                    this.timeouts.push(timeout);
                }

                particlesQueue.next(item);
            });

        this._outgoingParticles.subscribe((item) => {
            // Do not send particle after the peer has been stopped
            if (!this.isInitialized) {
                return;
            }

            log.debug(
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
                    log.error('id %s. send failed %j', item.particle.id, e);
                    item.onStageChange({ stage: 'sendingError' });
                });
        });
    }

    private _expireParticle(item: ParticleQueueItem) {
        const particleId = item.particle.id;
        log.debug(
            'id %s. particle has expired after %d. Deleting particle-related queues and handlers',
            item.particle.id,
            item.particle.ttl,
        );

        this.particleQueues.delete(particleId);
        this._particleSpecificHandlers.delete(particleId);

        item.onStageChange({ stage: 'expired' });
    }

    private _createParticlesProcessingQueue() {
        const particlesQueue = new Subject<ParticleQueueItem>();
        let prevData: Uint8Array = Buffer.from([]);

        particlesQueue
            .pipe(
                filterExpiredParticles(this._expireParticle.bind(this)),

                concatMap(async (item) => {
                    if (!this.isInitialized || this.marine === undefined) {
                        // If `.stop()` was called return null to stop particle processing immediately
                        return null;
                    }

                    // IMPORTANT!
                    // AVM runner execution and prevData <-> newData swapping
                    // MUST happen sequentially (in a critical section).
                    // Otherwise the race might occur corrupting the prevData

                    log.debug('id %s. sending particle to interpreter', item.particle.id);
                    log.trace('id %s. prevData: %a', item.particle.id, prevData);
                    const avmCallResult = await this.avmRunner.run(
                        {
                            initPeerId: item.particle.initPeerId,
                            currentPeerId: this.keyPair.getPeerId(),
                            timestamp: item.particle.timestamp,
                            ttl: item.particle.ttl,
                        },
                        item.particle.script,
                        prevData,
                        item.particle.data,
                        item.callResults,
                    );

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
                    log.error('id %s. interpreter failed: %s', item.particle.id, item.result.message);
                    item.onStageChange({ stage: 'interpreterError', errorMessage: item.result.message });
                    return;
                }

                if (item.result.retCode !== 0) {
                    log.error(
                        'id %s. interpreter failed: retCode: %d, message: %s',
                        item.particle.id,
                        item.result.retCode,
                        item.result.errorMessage,
                    );
                    log.trace('id %s. avm data: %a', item.particle.id, item.result.data);
                    item.onStageChange({ stage: 'interpreterError', errorMessage: item.result.errorMessage });
                    return;
                }

                log.trace(
                    'id %s. interpreter result: retCode: %d, avm data: %a',
                    item.particle.id,
                    item.result.retCode,
                    item.result.data,
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
                                    result: `Handler failed. fnName="${req.fnName}" serviceId="${
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
        log.trace('id %s. executing call service handler %j', particleId, req);

        if (this.marine && this._marineServices.has(req.serviceId)) {
            const result = await this.marine.callService(req.serviceId, req.fnName, req.args, undefined);

            return {
                retCode: ResultCodes.success,
                result: result as JSONValue,
            };
        }

        const key = serviceFnKey(req.serviceId, req.fnName);
        const psh = this._particleSpecificHandlers.get(particleId);
        let handler: GenericCallServiceHandler | undefined;

        // we should prioritize handler for this particle if there is one
        // if particle-specific handlers exist for this particle try getting handler there
        if (psh !== undefined) {
            handler = psh.get(key);
        }

        // then try to find a common handler for all particles with this service-fn key
        // if there is no particle-specific handler, get one from common map
        if (handler === undefined) {
            handler = this._commonHandlers.get(key);
        }

        // if no handler is found return useful error message to AVM
        if (handler === undefined) {
            return {
                retCode: ResultCodes.error,
                result: `No handler has been registered for serviceId='${req.serviceId}' fnName='${
                    req.fnName
                }' args='${jsonify(req.args)}'`,
            };
        }

        // if we found a handler, execute it
        const res = await handler(req);

        if (res.result === undefined) {
            res.result = null;
        }

        log.trace('id %s. executed call service handler, req: %j, res: %j ', particleId, req, res);
        return res;
    }

    private _stopParticleProcessing() {
        // do not hang if the peer has been stopped while some of the timeouts are still being executed
        this.timeouts.forEach((timeout) => {
            clearTimeout(timeout);
        });
        this.particleQueues.clear();
    }
}

function serviceFnKey(serviceId: string, fnName: string) {
    return `${serviceId}/${fnName}`;
}

function registerDefaultServices(peer: FluencePeer) {
    Object.entries(builtInServices).forEach(([serviceId, service]) => {
        Object.entries(service).forEach(([fnName, fn]) => {
            peer.internals.regHandler.common(serviceId, fnName, fn);
        });
    });
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
