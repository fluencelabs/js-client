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

import {
    AirInterpreter,
    CallRequestsArray,
    CallResultsArray,
    InterpreterResult,
    LogLevel,
    CallServiceResult as AvmCallServiceResult,
} from '@fluencelabs/avm';
import { Multiaddr, resolvers } from 'multiaddr';
import { CallServiceData, CallServiceResult, GenericCallServiceHandler, ResultCodes } from './commonTypes';
import { CallServiceHandler as LegacyCallServiceHandler } from './compilerSupport/LegacyCallServiceHandler';
import { PeerIdB58 } from './commonTypes';
import { FluenceConnection } from './FluenceConnection';
import { Particle } from './Particle';
import { KeyPair } from './KeyPair';
import { createInterpreter, dataToString } from './utils';
import { filter, map, Subject, tap } from 'rxjs';
import { RequestFlow } from './compilerSupport/v1';
import log from 'loglevel';
import { defaultServices } from './defaultServices';

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
}

/**
 * Information about Fluence Peer connection
 */
export interface PeerStatus {
    /**
     * Is the peer connected to network or not
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

        this._interpreter = await createInterpreter(config?.avmLogLevel || 'off');

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
                onIncomingParticle: (p) => this._incomingParticles.next(p),
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
        this._timeoutHandlers.clear();
    }

    // internal api

    /**
     * Is not intended to be used manually. Subject to change
     */
    get internals() {
        return {
            initiateParticle: (particle: Particle): void => {
                if (particle.initPeerId === undefined) {
                    particle.initPeerId = this.getStatus().peerId;
                }

                this._incomingParticles.next(particle);
            },
            regHandler: {
                common: (
                    // force new line
                    serviceId: string,
                    fnName: string,
                    handler: GenericCallServiceHandler,
                ) => {
                    this._commonHandlers.set(serviceFnKey(serviceId, fnName), handler);
                },
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
                timeout: (particleId: string, handler: () => void) => {
                    this._timeoutHandlers.set(particleId, handler);
                },
            },

            /**
             * @deprecated
             */
            initiateFlow: (request: RequestFlow): void => {
                const particle = request.particle;
                if (particle.initPeerId === undefined) {
                    particle.initPeerId = this.getStatus().peerId;
                }

                this._legacyParticleSpecificHandlers.set(particle.id, {
                    handler: request.handler,
                    error: request.error,
                    timeout: request.timeout,
                });

                this._incomingParticles.next(request.particle);
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

    // TODO:: make public
    private async _connect(): Promise<void> {
        return this._connection?.connect();
    }

    // TODO:: make public
    private async _disconnect(): Promise<void> {
        if (this._connection) {
            return this._connection.disconnect();
        }
    }

    private _incomingParticles = new Subject<Particle>();
    private _outgoingParticles = new Subject<Particle>();

    private _particleSpecificHandlers = new Map<string, Map<string, GenericCallServiceHandler>>();
    private _commonHandlers = new Map<string, GenericCallServiceHandler>();
    private _timeoutHandlers = new Map<string, () => void>();

    private _timeouts: Array<NodeJS.Timeout> = [];

    private _keyPair: KeyPair;
    private _connection: FluenceConnection;
    private _interpreter: AirInterpreter;

    private _relayPeerId: PeerIdB58 | null = null;

    private _startParticleProcessing() {
        const particleQueues = new Map<string, Subject<Particle>>();

        this._incomingParticles
            .pipe(
                tap((x) => x.logTo('debug', 'particle received:')),
                filter((x) => !x.hasExpired()),
                map((x) => x),
            )
            .subscribe((p) => {
                let particlesQueue = particleQueues.get(p.id);

                if (!particlesQueue) {
                    particlesQueue = this._createParticlesProcessingQueue();
                    particleQueues.set(p.id, particlesQueue);

                    const timeout = setTimeout(() => {
                        particleQueues.delete(p.id);
                        const timeoutHandler = this._timeoutHandlers.get(p.id);
                        if (timeoutHandler) {
                            timeoutHandler();
                        }
                        this._particleSpecificHandlers.delete(p.id);
                        this._timeoutHandlers.delete(p.id);
                    }, p.actualTtl());

                    this._timeouts.push(timeout);
                }

                particlesQueue.next(p);
            });

        this._outgoingParticles.subscribe((p) => {
            this._connection.sendParticle(p);
        });
    }

    private _createParticlesProcessingQueue() {
        let particlesQueue = new Subject<Particle>();
        let prevData: Uint8Array = Buffer.from([]);

        particlesQueue
            .pipe(
                filter((x) => !x.hasExpired()),
                map((x) => x),
            )
            .subscribe((x) => {
                const result = runInterpreter(this.getStatus().peerId, this._interpreter, x, prevData);

                prevData = Buffer.from(result.data);

                if (result.nextPeerPks.length > 0) {
                    const newParticle = x.clone();
                    newParticle.data = prevData;
                    this._outgoingParticles.next(newParticle);
                }

                if (result.callRequests.length > 0) {
                    this._execCallRequests(x, result.callRequests).then((callResults) => {
                        const newParticle = x.clone();
                        newParticle.callResults = callResults;
                        newParticle.data = Buffer.from([]);

                        particlesQueue.next(newParticle);
                    });
                }
            });

        return particlesQueue;
    }

    private async _execCallRequests(p: Particle, callRequests: CallRequestsArray): Promise<CallResultsArray> {
        const promises = callRequests.map(([key, callRequest]) => {
            const req = {
                fnName: callRequest.functionName,
                args: callRequest.arguments,
                serviceId: callRequest.serviceId,
                tetraplets: callRequest.tetraplets,
                particleContext: p.getParticleContext(),
            };

            const promise = this._execSingleCallRequest(req)
                .catch(
                    (err): CallServiceResult => ({
                        retCode: ResultCodes.exceptionInHandler,
                        result: `Handler failed. fnName="${req.fnName}" serviceId="${
                            req.serviceId
                        }" error: ${err.toString()}`,
                    }),
                )
                .then(
                    (res): AvmCallServiceResult => ({
                        result: JSON.stringify(res.result),
                        retCode: res.retCode,
                    }),
                )
                .then((res): [key: number, res: AvmCallServiceResult] => [key, res]);

            return promise;
        });
        const res = await Promise.all(promises);
        log.debug(`Executed call service for particle id=${p.id}, Call service results: `, res);
        return res;
    }

    private async _execSingleCallRequest(req: CallServiceData): Promise<CallServiceResult> {
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

        return res;
    }

    private _stopParticleProcessing() {
        for (let item of this._timeouts) {
            clearTimeout(item);
        }
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

function runInterpreter(
    currentPeerId: PeerIdB58,
    interpreter: AirInterpreter,
    particle: Particle,
    prevData: Uint8Array,
): InterpreterResult {
    particle.logTo('debug', 'Sending particle to interpreter');
    log.debug('prevData: ', dataToString(prevData));
    log.debug('data: ', dataToString(particle.data));
    const interpreterResult = interpreter.invoke(
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
    log.debug('Interpreter result: ', toLog);
    return interpreterResult;
}
