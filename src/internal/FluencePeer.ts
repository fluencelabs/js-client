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

import type { MultiaddrInput } from 'multiaddr';
import { CallServiceData, CallServiceResult, GenericCallServiceHandler, ResultCodes } from './commonTypes';
import { PeerIdB58 } from './commonTypes';
import { RelayConnection, FluenceConnection } from './FluenceConnection';
import { Particle, ParticleExecutionStage, ParticleQueueItem } from './Particle';
import { KeyPair } from './KeyPair';
import { throwIfNotSupported, dataToString, jsonify, MarineLoglevel, marineLogLevelToEnvs } from './utils';
import { concatMap, filter, pipe, Subject, tap } from 'rxjs';
import log from 'loglevel';
import { builtInServices } from './builtins/common';
import { defaultSigGuard, Sig } from './builtins/Sig';
import { registerSig } from './_aqua/services';
import Buffer from './Buffer';
import { FluenceAppService, loadDefaults, loadWasmFromFileSystem, loadWasmFromServer } from '@fluencelabs/marine-js';
import { AVM, AvmRunner } from './avm';
import { isBrowser, isNode } from 'browser-or-node';
import { InterpreterResult, LogLevel } from '@fluencelabs/avm';

/**
 * Node of the Fluence network specified as a pair of node's multiaddr and it's peer id
 */
type Node = {
    peerId: PeerIdB58;
    multiaddr: string;
};

const DEFAULT_TTL = 7000;

export type ConnectionOption = string | MultiaddrInput | Node;

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
     * - Implementation of FluenceConnection class, @see FluenceConnection
     * If not specified the will work locally and would not be able to send or receive particles.
     */
    connectTo?: ConnectionOption;

    /**
     * @deprecated. AVM run through marine-js infrastructure.
     * @see debug.marineLogLevel option to configure logging level of AVM
     */
    avmLogLevel?: MarineLoglevel;

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
     * @deprecated. AVM run through marine-js infrastructure.
     * @see marineJS option to configure AVM
     */
    avmRunner?: AvmRunner;

    /**
     * This option allows to specify the location of various dependencies needed for marine-js.
     * Each key specifies the location of the corresponding dependency.
     * If Fluence peer is started inside browser the location is treated as the path to the file relative to origin.
     * IF Fluence peer is started in nodejs the location is treated as the full path to file on the file system.
     */
    marineJS?: {
        /**
         * Configures path to the marine-js worker script.
         */
        workerScriptPath: string;

        /**
         * Configures the path to marine-js control wasm module
         */
        marineWasmPath: string;

        /**
         * Configures the path to AVM wasm module
         */
        avmWasmPath: string;
    };

    /**
     * Enables\disabled various debugging features
     */
    debug?: {
        /**
         * If set to true, newly initiated particle ids will be printed to console.
         * Useful to see what particle id is responsible for aqua function
         */
        printParticleId?: boolean;

        /**
         * Log level for marine services. By default logging is turned off.
         */
        marineLogLevel?: LogLevel;
    };
}

/**
 * Information about Fluence Peer connection.
 * Represented as object with the following keys:
 * - `isInitialized`: Is the peer initialized or not.
 * - `peerId`: Peer Id of the peer. Null if the peer is not initialized
 * - `isConnected`: Is the peer connected to network or not
 * - `relayPeerId`: Peer Id of the relay the peer is connected to. If the connection is direct relayPeerId is null
 * - `isDirect`: True if the peer is connected to the network directly (not through relay)
 */
export type PeerStatus =
    | {
          isInitialized: false;
          peerId: null;
          isConnected: false;
          relayPeerId: null;
      }
    | {
          isInitialized: true;
          peerId: PeerIdB58;
          isConnected: false;
          relayPeerId: null;
      }
    | {
          isInitialized: true;
          peerId: PeerIdB58;
          isConnected: true;
          relayPeerId: PeerIdB58;
      }
    | {
          isInitialized: true;
          peerId: PeerIdB58;
          isConnected: true;
          isDirect: true;
          relayPeerId: null;
      };

/**
 * This class implements the Fluence protocol for javascript-based environments.
 * It provides all the necessary features to communicate with Fluence network
 */
export class FluencePeer {
    /**
     * Checks whether the object is instance of FluencePeer class
     * @param obj - object to check if it is FluencePeer
     * @returns true if the object is FluencePeer false otherwise
     */
    static isInstance(obj: unknown): obj is FluencePeer {
        return obj instanceof FluencePeer;
    }

    /**
     * Get the peer's status
     */
    getStatus(): PeerStatus {
        // TODO:: use explicit mechanism for peer's state
        if (this._keyPair === undefined) {
            return {
                isInitialized: false,
                peerId: null,
                isConnected: false,
                relayPeerId: null,
            };
        }

        if (this._connection === undefined) {
            return {
                isInitialized: true,
                peerId: this._keyPair.Libp2pPeerId.toB58String(),
                isConnected: false,
                relayPeerId: null,
            };
        }

        if (this._connection.relayPeerId === null) {
            return {
                isInitialized: true,
                peerId: this._keyPair.Libp2pPeerId.toB58String(),
                isConnected: true,
                isDirect: true,
                relayPeerId: null,
            };
        }

        return {
            isInitialized: true,
            peerId: this._keyPair.Libp2pPeerId.toB58String(),
            isConnected: true,
            relayPeerId: this._connection.relayPeerId,
        };
    }

    /**
     * Initializes the peer: starts the Aqua VM, initializes the default call service handlers
     * and (optionally) connect to the Fluence network
     * @param config - object specifying peer configuration
     */
    async start(config: PeerConfig = {}): Promise<void> {
        throwIfNotSupported();
        const keyPair = config.KeyPair ?? (await KeyPair.randomEd25519());
        const newConfig = { ...config, KeyPair: keyPair };

        await this.init(newConfig);

        const conn = await configToConnection(newConfig.KeyPair, config?.connectTo, config?.dialTimeoutMs);
        if (conn !== null) {
            await this.connect(conn);
        }
    }

    getServices() {
        if (this._classServices === undefined) {
            throw new Error(`Can't get services: peer is not initialized`);
        }
        return {
            ...this._classServices,
        };
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
        if (!this._fluenceAppService) {
            throw new Error("Can't register marine service: peer is not initialized");
        }
        if (this._containsService(serviceId)) {
            throw new Error(`Service with '${serviceId}' id already exists`);
        }

        await this._fluenceAppService.createService(
            wasm,
            serviceId,
            undefined,
            marineLogLevelToEnvs(this._marineLogLevel),
        );
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
     * Un-initializes the peer: stops all the underlying workflows, stops the Aqua VM
     * and disconnects from the Fluence network
     */
    async stop() {
        this._keyPair = undefined; // This will set peer to non-initialized state and stop particle processing
        this._stopParticleProcessing();
        await this.disconnect();
        await this._avmRunner?.terminate();
        await this._fluenceAppService?.terminate();
        this._avmRunner = undefined;
        this._fluenceAppService = undefined;
        this._classServices = undefined;

        this._particleSpecificHandlers.clear();
        this._commonHandlers.clear();
        this._marineServices.clear();
    }

    // internal api

    /**
     * @private Is not intended to be used manually. Subject to change
     */
    get internals() {
        return {
            parseAst: async (air: string): Promise<{ success: boolean; data: any }> => {
                const status = this.getStatus();

                if (!status.isInitialized) {
                    new Error("Can't use avm: peer is not initialized");
                }

                const args = JSON.stringify([air]);
                const rawRes = await this._fluenceAppService!.callService('avm', 'ast', args, undefined);
                let res;
                try {
                    res = JSON.parse(rawRes);
                    res = res.result as string;
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
                    throw new Error('Failed to call avm. Raw result: ' + rawRes + '. Error: ' + err);
                }
            },
            createNewParticle: (script: string, ttl: number = this._defaultTTL) => {
                const status = this.getStatus();

                if (!status.isInitialized) {
                    return new Error("Can't create new particle: peer is not initialized");
                }

                return Particle.createNew(script, ttl, status.peerId);
            },
            /**
             * Initiates a new particle execution starting from local peer
             * @param particle - particle to start execution of
             */
            initiateParticle: (particle: Particle, onStageChange: (stage: ParticleExecutionStage) => void): void => {
                const status = this.getStatus();
                if (!status.isInitialized) {
                    throw new Error('Cannot initiate new particle: peer is not initialized');
                }

                if (this._printParticleId) {
                    console.log('Particle id: ', particle.id);
                }

                if (particle.initPeerId === undefined) {
                    particle.initPeerId = status.peerId;
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
        };
    }

    /**
     * @private Subject to change. Do not use this method directly
     */
    async init(config: PeerConfig & Required<Pick<PeerConfig, 'KeyPair'>>) {
        this._keyPair = config.KeyPair;

        const peerId = this._keyPair.Libp2pPeerId.toB58String();

        if (config?.debug?.printParticleId) {
            this._printParticleId = true;
        }

        this._defaultTTL = config?.defaultTtlMs ?? DEFAULT_TTL;

        if (config?.debug?.marineLogLevel) {
            this._marineLogLevel = config.debug.marineLogLevel;
        }

        this._fluenceAppService = new FluenceAppService(config?.marineJS?.workerScriptPath);
        const marineDeps = config?.marineJS
            ? await loadMarineAndAvm(config.marineJS.marineWasmPath, config.marineJS.avmWasmPath)
            : await loadDefaults();
        await this._fluenceAppService.init(marineDeps.marine);
        await this._fluenceAppService.createService(
            marineDeps.avm,
            'avm',
            undefined,
            marineLogLevelToEnvs(this._marineLogLevel),
        );
        this._avmRunner = config?.avmRunner || new AVM(this._fluenceAppService);
        await this._avmRunner.init(config?.avmLogLevel || 'off');

        registerDefaultServices(this);

        this._classServices = {
            sig: new Sig(this._keyPair),
        };
        this._classServices.sig.securityGuard = defaultSigGuard(peerId);
        registerSig(this, this._classServices.sig);
        registerSig(this, peerId, this._classServices.sig);

        this._startParticleProcessing();
    }

    /**
     * @private Subject to change. Do not use this method directly
     */
    async connect(connection: FluenceConnection): Promise<void> {
        if (this._connection) {
            await this._connection.disconnect();
        }

        this._connection = connection;

        await this._connection.connect(this._onIncomingParticle.bind(this));
    }

    /**
     * @private Subject to change. Do not use this method directly
     */
    async disconnect(): Promise<void> {
        if (this._connection) {
            await this._connection.disconnect();
            this._connection = undefined;
        }
    }

    // private

    // Queues for incoming and outgoing particles

    private _incomingParticles = new Subject<ParticleQueueItem>();
    private _outgoingParticles = new Subject<ParticleQueueItem & { nextPeerIds: PeerIdB58[] }>();

    // Call service handler

    private _marineServices = new Set<string>();
    private _marineLogLevel?: MarineLoglevel;
    private _particleSpecificHandlers = new Map<string, Map<string, GenericCallServiceHandler>>();
    private _commonHandlers = new Map<string, GenericCallServiceHandler>();

    private _classServices?: {
        sig: Sig;
    };

    private _containsService(serviceId: string): boolean {
        return this._marineServices.has(serviceId) || this._commonHandlers.has(serviceId);
    }

    // Internal peer state

    private _printParticleId = false;
    private _defaultTTL: number = DEFAULT_TTL;
    private _keyPair: KeyPair | undefined;
    private _connection?: FluenceConnection;

    /**
     * @deprecated. AVM run through marine-js infrastructure. This field is needed for backward compatibility with the previous API
     */
    private _avmRunner?: AvmRunner;
    private _fluenceAppService?: FluenceAppService;
    private _timeouts: Array<NodeJS.Timeout> = [];
    private _particleQueues = new Map<string, Subject<ParticleQueueItem>>();

    private _onIncomingParticle(p: string) {
        const particle = Particle.fromString(p);
        this._incomingParticles.next({ particle, onStageChange: () => {} });
    }

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

        this._outgoingParticles.subscribe((item) => {
            // Do not send particle after the peer has been stopped
            if (!this.getStatus().isInitialized) {
                return;
            }

            if (!this._connection) {
                item.particle.logTo('error', 'cannot send particle, peer is not connected');
                item.onStageChange({ stage: 'sendingError' });
                return;
            }
            item.particle.logTo('debug', 'sending particle:');
            this._connection.sendParticle(item.nextPeerIds, item.particle.toString()).then(
                () => {
                    item.onStageChange({ stage: 'sent' });
                },
                (e) => {
                    log.error(e);
                },
            );
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
        const particlesQueue = new Subject<ParticleQueueItem>();
        let prevData: Uint8Array = Buffer.from([]);

        particlesQueue
            .pipe(
                filterExpiredParticles(this._expireParticle.bind(this)),

                concatMap(async (item) => {
                    const status = this.getStatus();
                    if (!status.isInitialized || this._avmRunner === undefined) {
                        // If `.stop()` was called return null to stop particle processing immediately
                        return null;
                    }

                    // IMPORTANT!
                    // AVM runner execution and prevData <-> newData swapping
                    // MUST happen sequentially (in a critical section).
                    // Otherwise the race between runner might occur corrupting the prevData

                    const result = await runAvmRunner(status.peerId, this._avmRunner, item.particle, prevData);
                    const newData = Buffer.from(result.data);
                    prevData = newData;

                    return {
                        ...item,
                        result: result,
                        newData: newData,
                    };
                }),
            )
            .subscribe((item) => {
                // If `.stop()` was called then item will be null and we need to stop particle processing immediately
                if (item === null || !this.getStatus().isInitialized) {
                    return;
                }

                // Do not continue if there was an error in particle interpretation
                if (!isInterpretationSuccessful(item.result)) {
                    item.onStageChange({ stage: 'interpreterError', errorMessage: item.result.errorMessage });
                    return;
                }

                setTimeout(() => {
                    item.onStageChange({ stage: 'interpreted' });
                }, 0);

                // send particle further if requested
                if (item.result.nextPeerPks.length > 0) {
                    const newParticle = item.particle.clone();
                    newParticle.data = item.newData;
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
                            particleContext: item.particle.getParticleContext(),
                        };

                        this._execSingleCallRequest(req)
                            .catch(
                                (err): CallServiceResult => ({
                                    retCode: ResultCodes.error,
                                    result: `Handler failed. fnName="${req.fnName}" serviceId="${
                                        req.serviceId
                                    }" error: ${err.toString()}`,
                                }),
                            )
                            .then((res) => {
                                const serviceResult = {
                                    result: jsonify(res.result),
                                    retCode: res.retCode,
                                };

                                const newParticle = item.particle.clone();
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
        log.debug('executing call service handler', jsonify(req));
        const particleId = req.particleContext.particleId;

        if (this._fluenceAppService && this._marineServices.has(req.serviceId)) {
            const args = JSON.stringify(req.args);
            const rawResult = await this._fluenceAppService.callService(req.serviceId, req.fnName, args, undefined);

            try {
                const result = JSON.parse(rawResult);
                if (typeof result.error === 'string' && result.error.length > 0) {
                    return {
                        retCode: ResultCodes.error,
                        result: result.error,
                    };
                }

                if (result.result === undefined) {
                    throw new Error(
                        `Call to marine-js returned no error and empty result. Original request: ${jsonify(req)}`,
                    );
                }

                return {
                    retCode: ResultCodes.success,
                    result: result.result,
                };
            } catch (e) {
                throw new Error(`Call to marine-js. Result parsing error: ${e}, original text: ${rawResult}`);
            }
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

        log.debug('executed call service handler, req and res are: ', jsonify(req), jsonify(res));
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

async function configToConnection(
    keyPair: KeyPair,
    connection?: ConnectionOption,
    dialTimeoutMs?: number,
): Promise<FluenceConnection | null> {
    if (!connection) {
        return null;
    }

    if (connection instanceof FluenceConnection) {
        return connection;
    }

    let connectToMultiAddr: MultiaddrInput;
    // figuring out what was specified as input
    const tmp = connection as any;
    if (tmp.multiaddr !== undefined) {
        // specified as FluenceNode (object with multiaddr and peerId props)
        connectToMultiAddr = tmp.multiaddr;
    } else {
        // specified as MultiaddrInput
        connectToMultiAddr = tmp;
    }

    const res = await RelayConnection.createConnection({
        peerId: keyPair.Libp2pPeerId,
        relayAddress: connectToMultiAddr,
        dialTimeoutMs: dialTimeoutMs,
    });
    return res;
}

function isInterpretationSuccessful(result: InterpreterResult) {
    return result.retCode === 0;
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

async function runAvmRunner(
    currentPeerId: PeerIdB58,
    runner: AvmRunner,
    particle: Particle,
    prevData: Uint8Array,
): Promise<InterpreterResult> {
    particle.logTo('debug', 'Sending particle to interpreter');
    log.debug('prevData: ', dataToString(prevData));
    const interpreterResult = await runner.run(
        particle.script,
        prevData,
        particle.data,
        {
            initPeerId: particle.initPeerId,
            currentPeerId: currentPeerId,
            timestamp: particle.timestamp,
            ttl: particle.ttl,
        },
        particle.callResults,
    );

    const toLog = { ...interpreterResult, data: dataToString(interpreterResult.data) };

    if (isInterpretationSuccessful(interpreterResult)) {
        log.debug('Interpreter result: ', jsonify(toLog));
    } else {
        log.error('Interpreter failed: ', jsonify(toLog));
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

async function loadMarineAndAvm(
    marinePath: string,
    avmPath: string,
): Promise<{
    marine: SharedArrayBuffer | Buffer;
    avm: SharedArrayBuffer | Buffer;
}> {
    let promises: [Promise<SharedArrayBuffer | Buffer>, Promise<SharedArrayBuffer | Buffer>];
    // check if we are running inside the browser and instantiate worker with the corresponding script
    if (isBrowser) {
        promises = [
            // force new line
            loadWasmFromServer(marinePath),
            loadWasmFromServer(avmPath),
        ];
    } else if (isNode) {
        promises = [
            // force new line
            loadWasmFromFileSystem(marinePath),
            loadWasmFromFileSystem(avmPath),
        ];
    } else {
        throw new Error('Unknown environment');
    }

    const [marine, avm] = await Promise.all(promises);
    return {
        marine,
        avm,
    };
}
