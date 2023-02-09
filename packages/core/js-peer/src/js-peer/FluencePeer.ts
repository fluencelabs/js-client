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

import { RelayConnection } from '../connection/index.js';
import { FluenceConnection, IAvmRunner, IMarine } from '../interfaces/index.js';
import { KeyPair } from '../keypair/index.js';
import {
    CallServiceData,
    CallServiceResult,
    GenericCallServiceHandler,
    ResultCodes,
} from '../interfaces/commonTypes.js';
import {
    PeerIdB58,
    IFluenceClient,
    PeerStatus,
    CallFunctionArgs,
    RegisterServiceArgs,
    ClientOptions,
    keyPairOptions,
    RelayOptions,
} from '@fluencelabs/interface';
import { Particle, ParticleExecutionStage, ParticleQueueItem } from './Particle.js';
import { dataToString, jsonify, isString, ServiceError } from './utils.js';
import { concatMap, filter, pipe, Subject, tap } from 'rxjs';
import log from 'loglevel';
import { builtInServices } from './builtins/common.js';
import { defaultSigGuard, Sig } from './builtins/Sig.js';
import { registerSig } from './_aqua/services.js';
import { registerSrv } from './_aqua/single-module-srv.js';
import { Buffer } from 'buffer';

import { JSONValue } from '@fluencelabs/avm';
import { LogLevel } from '@fluencelabs/marine-js/dist/types';
import { NodeUtils, Srv } from './builtins/SingleModuleSrv.js';
import { registerNodeUtils } from './_aqua/node-utils.js';
import type { MultiaddrInput } from '@multiformats/multiaddr';
import { callFunctionImpl } from '../compilerSupport/callFunction.js';
import { registerServiceImpl } from '../compilerSupport/registerService.js';

const DEFAULT_TTL = 7000;

export type PeerConfig = ClientOptions;

/**
 * This class implements the Fluence protocol for javascript-based environments.
 * It provides all the necessary features to communicate with Fluence network
 */
export class FluencePeer implements IFluenceClient {
    constructor(private marine: IMarine, private avmRunner: IAvmRunner) {}

    /**
     * Internal contract to cast unknown objects to IFluenceClient.
     * If an unknown object has this property then we assume it is in fact a Peer and it implements IFluenceClient
     * Check against this variable MUST NOT be coupled with any `FluencePeer` because otherwise it might get bundled
     * brining a lot of unnecessary stuff alongside with it
     */
    __isFluenceAwesome = true;

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

        if (this.connection === null) {
            return {
                isInitialized: true,
                peerId: this._keyPair.getPeerId(),
                isConnected: false,
                relayPeerId: null,
            };
        }

        if (this.connection.relayPeerId === null) {
            return {
                isInitialized: true,
                peerId: this._keyPair.getPeerId(),
                isConnected: true,
                isDirect: true,
                relayPeerId: null,
            };
        }

        return {
            isInitialized: true,
            peerId: this._keyPair.getPeerId(),
            isConnected: true,
            relayPeerId: this.connection.relayPeerId,
        };
    }

    /**
     * Initializes the peer: starts the Aqua VM, initializes the default call service handlers
     * and (optionally) connect to the Fluence network
     * @param config - object specifying peer configuration
     */
    async start(config: PeerConfig = {}): Promise<void> {
        const keyPair = await makeKeyPair(config.keyPair);
        await this.init(config, keyPair);

        const conn = await configToConnection(keyPair, config?.relay, config?.connectionOptions?.dialTimeoutMs);

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
        if (!this.marine) {
            throw new Error("Can't register marine service: peer is not initialized");
        }
        if (this._containsService(serviceId)) {
            throw new Error(`Service with '${serviceId}' id already exists`);
        }

        await this.marine.createService(wasm, serviceId, this._marineLogLevel);
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
        await this.marine.stop();
        await this.avmRunner.stop();
        this._classServices = undefined;

        this._particleSpecificHandlers.clear();
        this._commonHandlers.clear();
        this._marineServices.clear();
    }

    // internal api
    get compilerSupport() {
        return {
            callFunction: (args: CallFunctionArgs): Promise<unknown> => {
                return callFunctionImpl(args.def, args.script, args.config, this, args.args);
            },
            registerService: (args: RegisterServiceArgs): void => {
                return registerServiceImpl(this, args.def, args.serviceId, args.service);
            },
        };
    }

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
    async init(config: Omit<PeerConfig, 'keyPair'>, keyPair: KeyPair) {
        this._keyPair = keyPair;

        const peerId = this._keyPair.getPeerId();

        if (config?.debug?.printParticleId) {
            this._printParticleId = true;
        }

        this._defaultTTL = config?.defaultTtlMs ?? DEFAULT_TTL;

        if (config?.debug?.marineLogLevel) {
            this._marineLogLevel = config.debug.marineLogLevel;
        }

        await this.marine.start();
        await this.avmRunner.start();

        registerDefaultServices(this);

        // TODO: doesn't work in web, fix!
        this._classServices = {
            sig: new Sig(this._keyPair),
            srv: new Srv(this),
        };
        this._classServices.sig.securityGuard = defaultSigGuard(peerId);
        registerSig(this, 'sig', this._classServices.sig);
        registerSig(this, peerId, this._classServices.sig);

        registerSrv(this, 'single_module_srv', this._classServices.srv);
        registerNodeUtils(this, 'node_utils', new NodeUtils(this));

        this._startParticleProcessing();
    }

    /**
     * @private Subject to change. Do not use this method directly
     */
    async connect(connection: FluenceConnection): Promise<void> {
        if (this.connection) {
            await this.connection.disconnect();
        }

        this.connection = connection;
        await this.connection.connect(this._onIncomingParticle.bind(this));
    }

    /**
     * @private Subject to change. Do not use this method directly
     */
    async disconnect(): Promise<void> {
        await this.connection?.disconnect();
    }

    // private

    // Queues for incoming and outgoing particles

    private _incomingParticles = new Subject<ParticleQueueItem>();
    private _outgoingParticles = new Subject<ParticleQueueItem & { nextPeerIds: PeerIdB58[] }>();

    // Call service handler

    private _marineServices = new Set<string>();
    private _marineLogLevel?: LogLevel;
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

    private connection: FluenceConnection | null = null;
    private _printParticleId = false;
    private _defaultTTL: number = DEFAULT_TTL;
    private _keyPair: KeyPair | undefined;
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

            if (!this.connection) {
                item.particle.logTo('error', 'cannot send particle, peer is not connected');
                item.onStageChange({ stage: 'sendingError' });
                return;
            }
            item.particle.logTo('debug', 'sending particle:');
            this.connection?.sendParticle(item.nextPeerIds, item.particle.toString()).then(
                () => {
                    item.onStageChange({ stage: 'sent' });
                },
                (e: any) => {
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
                    if (!status.isInitialized || this.marine === undefined) {
                        // If `.stop()` was called return null to stop particle processing immediately
                        return null;
                    }

                    // IMPORTANT!
                    // AVM runner execution and prevData <-> newData swapping
                    // MUST happen sequentially (in a critical section).
                    // Otherwise the race between runner might occur corrupting the prevData

                    item.particle.logTo('debug', 'Sending particle to interpreter');
                    log.debug('prevData: ', dataToString(prevData));

                    const avmCallResult = await this.avmRunner.run(
                        {
                            initPeerId: item.particle.initPeerId,
                            currentPeerId: status.peerId,
                            timestamp: item.particle.timestamp,
                            ttl: item.particle.ttl,
                        },
                        item.particle.script,
                        prevData,
                        item.particle.data,
                        item.particle.callResults,
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
                // If `.stop()` was called then item will be null and we need to stop particle processing immediately
                if (item === null || !this.getStatus().isInitialized) {
                    return;
                }

                // Do not proceed further if the particle is expired
                if (item.particle.hasExpired()) {
                    return;
                }

                // Do not continue if there was an error in particle interpretation
                if (item.result instanceof Error) {
                    log.error('Interpreter failed: ', jsonify(item.result.message));
                    item.onStageChange({ stage: 'interpreterError', errorMessage: item.result.message });
                    return;
                }

                const toLog = { ...item.result, data: dataToString(item.result.data) };
                if (item.result.retCode !== 0) {
                    log.error('Interpreter failed: ', jsonify(toLog));
                    item.onStageChange({ stage: 'interpreterError', errorMessage: item.result.errorMessage });
                    return;
                }

                log.debug('Interpreter result: ', jsonify(toLog));

                setTimeout(() => {
                    item.onStageChange({ stage: 'interpreted' });
                }, 0);

                // send particle further if requested
                if (item.result.nextPeerPks.length > 0) {
                    const newParticle = item.particle.clone();
                    const newData = Buffer.from(item.result.data);
                    newParticle.data = newData;
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

                        if (item.particle.hasExpired()) {
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
    connection?: RelayOptions,
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
        peerId: keyPair.getLibp2pPeerId(),
        relayAddress: connectToMultiAddr,
        dialTimeoutMs: dialTimeoutMs,
    });
    return res;
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
            if (item.particle.hasExpired()) {
                onParticleExpiration(item);
            }
        }),
        filter((x: ParticleQueueItem) => !x.particle.hasExpired()),
    );
}

async function makeKeyPair(opts?: keyPairOptions) {
    return await KeyPair.randomEd25519();
}
