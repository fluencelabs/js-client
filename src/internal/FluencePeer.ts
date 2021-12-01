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

import { Multiaddr } from 'multiaddr';
import { CallServiceData, CallServiceResult, GenericCallServiceHandler, ResultCodes } from './commonTypes';
import { CallServiceHandler as LegacyCallServiceHandler } from './compilerSupport/LegacyCallServiceHandler';
import { PeerIdB58 } from './commonTypes';
import { FluenceConnection } from './FluenceConnection';
import { Particle, ParticleExecutionStage, ParticleQueueItem } from './Particle';
import { KeyPair } from './KeyPair';
import { dataToString, avmLogFunction } from './utils';
import { filter, pipe, Subject, tap } from 'rxjs';
import { RequestFlow } from './compilerSupport/v1';
import log from 'loglevel';
import { defaultServices } from './defaultServices';
import { AvmWorker, InterpreterResult, LogLevel } from '@fluencelabs/avm-worker-common';
import Worker from '@fluencelabs/avm-worker';

/**
 * Node of the Fluence network specified as a pair of node's multiaddr and it's peer id
 */
type Node = {
    peerId: PeerIdB58;
    multiaddr: string;
};

/**
 * Enum representing the log level used in Aqua VM.
 * Possible values: 'info', 'trace', 'debug', 'info', 'warn', 'error', 'off';
 */
export type AvmLoglevel = LogLevel;

const DEFAULT_TTL = 7000;

/**
 * Configuration used when initiating Fluence Peer
 */
export interface PeerConfig {
    /**
     * Node in Fluence network to connect to.
     * Can be in the form of:
     * - string: multiaddr in string format
     * - Multiaddr: multiaddr object, @see https://github.com/multiformats/js-multiaddr
     * - Node: node structure, @see Node
     * If not specified the will work locally and would not be able to send or receive particles.
     */
    connectTo?: string | Multiaddr | Node;

    /**
     * Specify log level for Aqua VM running on the peer
     */
    avmLogLevel?: AvmLoglevel;

    /**
     * Specify the KeyPair to be used to identify the Fluence Peer.
     * Will be generated randomly if not specified
     */
    KeyPair?: KeyPair;

    /**
     * When the peer established the connection to the network it sends a ping-like message to check if it works correctly.
     * The options allows to specify the timeout for that message in milliseconds.
     * If not specified the default timeout will be used
     */
    checkConnectionTimeoutMs?: number;

    /**
     * When the peer established the connection to the network it sends a ping-like message to check if it works correctly.
     * If set to true, the ping-like message will be skipped
     * Default: false
     */
    skipCheckConnection?: boolean;

    /**
     * The dialing timeout in milliseconds
     */
    dialTimeoutMs?: number;

    /**
     * Sets the default TTL for all particles originating from the peer with no TTL specified.
     * If the originating particle's TTL is defined then that value will be used
     * If the option is not set default TTL will be 7000
     */
    defaultTtlMs?: number;

    /**
     * Pluggable AVM worker implementation
     */
    avmWorker?: AvmWorker;
}

/**
 * Information about Fluence Peer connection
 */
export interface PeerStatus {
    /**
     * Is the peer initialized or not
     */
    isInitialized: Boolean;

    /**
     * Is the peer connected to network or not
     */
    isConnected: Boolean;

    /**
     * The Peer's identification in the Fluence network
     */
    peerId: PeerIdB58 | null;

    /**
     * The relays's peer id to which the peer is connected to
     */
    relayPeerId: PeerIdB58 | null;
}

/**
 * This class implements the Fluence protocol for javascript-based environments.
 * It provides all the necessary features to communicate with Fluence network
 */
export class FluencePeer {
    /**
     * Creates a new Fluence Peer instance.
     */
    constructor() {}

    /**
     * Checks whether the object is instance of FluencePeer class
     * @param obj - object to check if it is FluencePeer
     * @returns true if the object is FluencePeer false otherwise
     */
    static isInstance(obj: FluencePeer): boolean {
        if (obj && obj._isFluenceAwesome) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Get the peer's status
     */
    getStatus(): PeerStatus {
        const hasKeyPair = this._keyPair !== undefined;
        return {
            isInitialized: hasKeyPair,
            isConnected: this._connection !== undefined,
            peerId: this._keyPair?.Libp2pPeerId?.toB58String() || null,
            relayPeerId: this._relayPeerId || null,
        };
    }

    /**
     * Initializes the peer: starts the Aqua VM, initializes the default call service handlers
     * and (optionally) connect to the Fluence network
     * @param config - object specifying peer configuration
     */
    async start(config?: PeerConfig): Promise<void> {
        if (config?.KeyPair) {
            this._keyPair = config!.KeyPair;
        } else {
            this._keyPair = await KeyPair.randomEd25519();
        }

        this._defaultTTL =
            config?.defaultTtlMs !== undefined // don't miss value 0 (zero)
                ? config?.defaultTtlMs
                : DEFAULT_TTL;

        this._worker = config?.avmWorker || new Worker(avmLogFunction);
        await this._worker.init(config?.avmLogLevel || 'off');

        if (config?.connectTo) {
            let connectToMultiAddr: Multiaddr;
            let fromNode = (config.connectTo as any).multiaddr;
            if (fromNode) {
                connectToMultiAddr = new Multiaddr(fromNode);
            } else {
                connectToMultiAddr = new Multiaddr(config.connectTo as string);
            }

            this._relayPeerId = connectToMultiAddr.getPeerId();

            if (this._connection) {
                await this._connection.disconnect();
            }

            this._connection = await FluenceConnection.createConnection({
                peerId: this._keyPair.Libp2pPeerId,
                relayAddress: connectToMultiAddr,
                dialTimeoutMs: config.dialTimeoutMs,
                onIncomingParticle: (p) => this._incomingParticles.next({ particle: p, onStageChange: () => {} }),
            });

            await this._connect();
        }

        this._legacyCallServiceHandler = new LegacyCallServiceHandler();
        registerDefaultServices(this);

        this._startParticleProcessing();
    }

    /**
     * Un-initializes the peer: stops all the underlying workflows, stops the Aqua VM
     * and disconnects from the Fluence network
     */
    async stop() {
        this._stopParticleProcessing();
        await this._disconnect();
        this._relayPeerId = null;
        this._legacyCallServiceHandler = null;

        this._particleSpecificHandlers.clear();
        this._commonHandlers.clear();
    }

    // internal api

    /**
     * Is not intended to be used manually. Subject to change
     */
    get internals() {
        return {
            /**
             * Initiates a new particle execution starting from local peer
             * @param particle - particle to start execution of
             */
            initiateParticle: (particle: Particle, onStageChange: (stage: ParticleExecutionStage) => void): void => {
                if (!this.getStatus().isInitialized) {
                    throw 'Cannot initiate new particle: peer is not initialized';
                }

                if (particle.initPeerId === undefined) {
                    particle.initPeerId = this.getStatus().peerId;
                }

                if (particle.ttl === undefined) {
                    particle.ttl = this._defaultTTL;
                }

                this._incomingParticles.next({
                    particle: particle,
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

            /**
             * @deprecated
             */
            initiateFlow: (request: RequestFlow): void => {
                const particle = request.particle;

                this._legacyParticleSpecificHandlers.set(particle.id, {
                    handler: request.handler,
                    error: request.error,
                    timeout: request.timeout,
                });

                this.internals.initiateParticle(particle, (stage) => {
                    if (stage.stage === 'interpreterError') {
                        request?.error(stage.errorMessage);
                    }

                    if (stage.stage === 'expired') {
                        request?.timeout();
                    }
                });
            },

            /**
             * @deprecated
             */
            callServiceHandler: this._legacyCallServiceHandler,
        };
    }

    // private

    /**
     *  Used in `isInstance` to check if an object is of type FluencePeer. That's a hack to work around corner cases in JS type system
     */
    private _isFluenceAwesome = true;

    // TODO:: make public when full connection\disconnection cycle is implemented properly
    private async _connect(): Promise<void> {
        return this._connection?.connect();
    }

    // TODO:: make public when full connection\disconnection cycle is implemented properly
    private async _disconnect(): Promise<void> {
        if (this._connection) {
            return this._connection.disconnect();
        }
    }

    // Queues for incoming and outgoing particles

    private _incomingParticles = new Subject<ParticleQueueItem>();
    private _outgoingParticles = new Subject<ParticleQueueItem>();

    // Call service handler

    private _particleSpecificHandlers = new Map<string, Map<string, GenericCallServiceHandler>>();
    private _commonHandlers = new Map<string, GenericCallServiceHandler>();

    // Internal peer state

    private _defaultTTL: number;
    private _relayPeerId: PeerIdB58 | null = null;
    private _keyPair: KeyPair;
    private _connection: FluenceConnection;
    private _worker: AvmWorker;
    private _timeouts: Array<NodeJS.Timeout> = [];
    private _particleQueues = new Map<string, Subject<ParticleQueueItem>>();

    private _startParticleProcessing() {
        this._incomingParticles
            .pipe(
                tap((x) => {
                    x.particle.logTo('debug', 'particle received:');
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
                    }, p.actualTtl());

                    this._timeouts.push(timeout);
                }

                particlesQueue.next(item);
            });

        this._outgoingParticles.subscribe(async (item) => {
            if (!this._connection) {
                item.particle.logTo('error', 'cannot send particle, peer is not connected');
                item.onStageChange({ stage: 'sendingError' });
                return;
            }
            await this._connection.sendParticle(item.particle);
            item.onStageChange({ stage: 'sent' });
        });
    }

    private _expireParticle(item: ParticleQueueItem) {
        const particleId = item.particle.id;
        log.debug(
            `particle ${particleId} has expired after ${item.particle.ttl}. Deleting particle-related queues and handlers`,
        );

        this._particleQueues.delete(particleId);
        this._particleSpecificHandlers.delete(particleId);

        item.onStageChange({ stage: 'expired' });
    }

    private _createParticlesProcessingQueue() {
        let particlesQueue = new Subject<ParticleQueueItem>();
        let prevData: Uint8Array = Buffer.from([]);

        particlesQueue
            .pipe(
                // force new line
                filterExpiredParticles(this._expireParticle.bind(this)),
            )
            .subscribe(async (item) => {
                const particle = item.particle;
                const result = await runAvmWorker(this.getStatus().peerId, this._worker, particle, prevData);

                // Do not continue if there was an error in particle interpretation
                if (!isInterpretationSuccessful(result)) {
                    item.onStageChange({ stage: 'interpreterError', errorMessage: result.errorMessage });
                    return;
                }

                setTimeout(() => {
                    item.onStageChange({ stage: 'interpreted' });
                }, 0);

                const newData = Buffer.from(result.data);
                prevData = newData;

                // send particle further if requested
                if (result.nextPeerPks.length > 0) {
                    const newParticle = particle.clone();
                    newParticle.data = newData;
                    this._outgoingParticles.next({ ...item, particle: newParticle });
                }

                // execute call requests if needed
                // and put particle with the results back to queue
                if (result.callRequests.length > 0) {
                    for (let [key, cr] of result.callRequests) {
                        const req = {
                            fnName: cr.functionName,
                            args: cr.arguments,
                            serviceId: cr.serviceId,
                            tetraplets: cr.tetraplets,
                            particleContext: particle.getParticleContext(),
                        };

                        this._execSingleCallRequest(req)
                            .catch(
                                (err): CallServiceResult => ({
                                    retCode: ResultCodes.exceptionInHandler,
                                    result: `Handler failed. fnName="${req.fnName}" serviceId="${
                                        req.serviceId
                                    }" error: ${err.toString()}`,
                                }),
                            )
                            .then((res) => {
                                const serviceResult = {
                                    result: JSON.stringify(res.result),
                                    retCode: res.retCode,
                                };

                                const newParticle = particle.clone();
                                newParticle.callResults = [[key, serviceResult]];
                                newParticle.data = Buffer.from([]);

                                particlesQueue.next({ ...item, particle: newParticle });
                            });
                    }
                } else {
                    item.onStageChange({ stage: 'localWorkDone' });
                }
            });

        return particlesQueue;
    }

    private async _execSingleCallRequest(req: CallServiceData): Promise<CallServiceResult> {
        log.debug('executing call service handler', req);
        const particleId = req.particleContext.particleId;

        // trying particle-specific handler
        const lh = this._legacyParticleSpecificHandlers.get(particleId);
        let res: CallServiceResult = {
            result: undefined,
            retCode: undefined,
        };
        if (lh !== undefined) {
            res = lh.handler.execute(req);
        }

        // if it didn't return any result trying to run the common handler
        if (res?.result === undefined) {
            res = this._legacyCallServiceHandler.execute(req);
        }

        // No result from legacy handler.
        // Trying to execute async handler
        if (res.retCode === undefined) {
            const key = serviceFnKey(req.serviceId, req.fnName);
            const psh = this._particleSpecificHandlers.get(particleId);
            let handler: GenericCallServiceHandler;

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

            // if we found a handler, execute it
            // otherwise return useful  error message to AVM
            res = handler
                ? await handler(req)
                : {
                      retCode: ResultCodes.unknownError,
                      result: `No handler has been registered for serviceId='${req.serviceId}' fnName='${req.fnName}' args='${req.args}'`,
                  };
        }

        if (res.result === undefined) {
            res.result = null;
        }

        log.debug('executed call service handler, req and res are: ', req, res);
        return res;
    }

    private _stopParticleProcessing() {
        // do not hang if the peer has been stopped while some of the timeouts are still being executed
        for (let item of this._timeouts) {
            clearTimeout(item);
        }
        this._particleQueues.clear();
    }

    /**
     * @deprecated
     */
    private _legacyParticleSpecificHandlers = new Map<
        string,
        {
            handler: LegacyCallServiceHandler;
            timeout?: () => void;
            error?: (reason?: any) => void;
        }
    >();

    /**
     * @deprecated
     */
    private _legacyCallServiceHandler: LegacyCallServiceHandler;
}

function isInterpretationSuccessful(result: InterpreterResult) {
    return result.retCode === 0;
}

function serviceFnKey(serviceId: string, fnName: string) {
    return `${serviceId}/${fnName}`;
}

function registerDefaultServices(peer: FluencePeer) {
    for (let serviceId in defaultServices) {
        for (let fnName in defaultServices[serviceId]) {
            const h = defaultServices[serviceId][fnName];
            peer.internals.regHandler.common(serviceId, fnName, h);
        }
    }
}

async function runAvmWorker(
    currentPeerId: PeerIdB58,
    worker: AvmWorker,
    particle: Particle,
    prevData: Uint8Array,
): Promise<InterpreterResult> {
    particle.logTo('debug', 'Sending particle to interpreter');
    log.debug('prevData: ', dataToString(prevData));
    log.debug('data: ', dataToString(particle.data));
    const interpreterResult = await worker.run(
        particle.script,
        prevData,
        particle.data,
        {
            initPeerId: particle.initPeerId,
            currentPeerId: currentPeerId,
        },
        particle.callResults,
    );

    const toLog: any = { ...interpreterResult };
    toLog.data = dataToString(toLog.data);

    if (isInterpretationSuccessful(interpreterResult)) {
        log.debug('Interpreter result: ', toLog);
    } else {
        log.error('Interpreter failed: ', toLog);
    }
    return interpreterResult;
}

function filterExpiredParticles(onParticleExpiration: (item: ParticleQueueItem) => void) {
    return pipe(
        tap((item: ParticleQueueItem) => {
            if (item.particle.hasExpired()) {
                onParticleExpiration(item);
            }
        }),
        filter((x: ParticleQueueItem) => !x.particle.hasExpired()),
    );
}
