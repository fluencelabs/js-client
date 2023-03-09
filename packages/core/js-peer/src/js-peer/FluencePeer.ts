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
import { fromOpts, KeyPair } from '../keypair/index.js';
import {
    CallServiceData,
    CallServiceResult,
    GenericCallServiceHandler,
    ResultCodes,
} from '../interfaces/commonTypes.js';
import type {
    PeerIdB58,
    IFluenceClient,
    KeyPairOptions,
    RelayOptions,
    ClientOptions,
    ConnectionState,
} from '@fluencelabs/interfaces/dist/fluenceClient';
import { Particle, ParticleExecutionStage, ParticleQueueItem } from './Particle.js';
import { dataToString, jsonify, isString, ServiceError } from './utils.js';
import { concatMap, filter, pipe, Subject, tap } from 'rxjs';
import { builtInServices } from './builtins/common.js';
import { defaultSigGuard, Sig } from './builtins/Sig.js';
import { registerSig } from './_aqua/services.js';
import { registerSrv } from './_aqua/single-module-srv.js';
import { Buffer } from 'buffer';

import { JSONValue } from '@fluencelabs/avm';
import { NodeUtils, Srv } from './builtins/SingleModuleSrv.js';
import { registerNodeUtils } from './_aqua/node-utils.js';
import type { MultiaddrInput } from '@multiformats/multiaddr';

import { logger } from '../util/logger.js';

const log = logger('fluence:particle');

const DEFAULT_TTL = 7000;

export type PeerConfig = ClientOptions & { relay?: RelayOptions };

type PeerStatus =
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
export class FluencePeer implements IFluenceClient {
    connectionState: ConnectionState = 'disconnected';
    connectionStateChangeHandler: (state: ConnectionState) => void = () => {};

    constructor(private marine: IMarine, private avmRunner: IAvmRunner) {}

    /**
     * Internal contract to cast unknown objects to IFluenceClient.
     * If an unknown object has this property then we assume it is in fact a Peer and it implements IFluenceClient
     * Check against this variable MUST NOT be coupled with any `FluencePeer` because otherwise it might get bundled
     * brining a lot of unnecessary stuff alongside with it
     */
    __isFluenceAwesome = true;

    /**
     * TODO: remove this from here. Switch to `ConnectionState` instead
     * @deprecated
     */
    getStatus(): PeerStatus {
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

    getPeerId(): string {
        return this.getStatus().peerId!;
    }

    getRelayPeerId(): string {
        return this.getStatus().relayPeerId!;
    }

    getPeerSecretKey(): Uint8Array {
        if (!this._keyPair) {
            throw new Error("Can't get key pair: peer is not initialized");
        }

        return this._keyPair.toEd25519PrivateKey();
    }

    onConnectionStateChange(handler: (state: ConnectionState) => void): ConnectionState {
        this.connectionStateChangeHandler = handler;

        return this.connectionState;
    }

    /**
     * Connect to the Fluence network
     * @param relay - relay node to connect to
     * @param options - client options
     */
    async connect(relay: RelayOptions, options?: ClientOptions): Promise<void> {
        return this.start({ relay, ...options });
    }

    /**
     * Disconnect from the Fluence network
     */
    disconnect(): Promise<void> {
        return this.stop();
    }

    /**
     * Initializes the peer: starts the Aqua VM, initializes the default call service handlers
     * and (optionally) connect to the Fluence network
     * @param config - object specifying peer configuration
     */
    async start(config: PeerConfig = {}): Promise<void> {
        this.changeConnectionState('connecting');
        const keyPair = await makeKeyPair(config.keyPair);
        await this.init(config, keyPair);

        const conn = await configToConnection(keyPair, config.relay, config.connectionOptions?.dialTimeoutMs);

        if (conn !== null) {
            await this._connect(conn);
        }
        this.changeConnectionState('connected');
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
     * Un-initializes the peer: stops all the underlying workflows, stops the Aqua VM
     * and disconnects from the Fluence network
     */
    async stop() {
        this.changeConnectionState('disconnecting');
        this._keyPair = undefined; // This will set peer to non-initialized state and stop particle processing
        this._stopParticleProcessing();
        await this._disconnect();
        await this.marine.stop();
        await this.avmRunner.stop();
        this._classServices = undefined;

        this._particleSpecificHandlers.clear();
        this._commonHandlers.clear();
        this._marineServices.clear();
        this.changeConnectionState('disconnected');
    }

    // internal api

    /**
     * @private Is not intended to be used manually. Subject to change
     */
    get internals() {
        return {
            getConnectionState: () => this.connectionState,

            getRelayPeerId: () => this.getStatus().relayPeerId,

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

        await this.marine.start();
        await this.avmRunner.start();

        registerDefaultServices(this);

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
    async _connect(connection: FluenceConnection): Promise<void> {
        if (this.connection) {
            await this.connection.disconnect();
        }

        this.connection = connection;
        await this.connection.connect(this._onIncomingParticle.bind(this));
    }

    /**
     * @private Subject to change. Do not use this method directly
     */
    async _disconnect(): Promise<void> {
        await this.connection?.disconnect();
    }

    // private

    private changeConnectionState(state: ConnectionState) {
        this.connectionState = state;
        this.connectionStateChangeHandler(state);
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
                    log.trace('particle received: %p', x.particle);
                    log.debug('particle content: %P', x.particle);
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
                log.error('cannot send particle %p, peer is not connected', item.particle);
                item.onStageChange({ stage: 'sendingError' });
                return;
            }
            log.trace('sending particle %p into network', item.particle);
            this.connection
                ?.sendParticle(item.nextPeerIds, item.particle.toString())
                .then(() => {
                    item.onStageChange({ stage: 'sent' });
                })
                .catch((e: any) => {
                    log.error('sending failed %o', e);
                });
        });
    }

    private _expireParticle(item: ParticleQueueItem) {
        const particleId = item.particle.id;
        log.trace(
            'particle %p has expired after %d. Deleting particle-related queues and handlers',
            item.particle,
            item.particle.ttl,
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
                    // Otherwise the race might occur corrupting the prevData

                    log.trace('sending particle %p to interpreter', item.particle);
                    log.debug('prevData: %a', prevData);

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
                    log.error('interpreter failed: %o', item.result.message);
                    item.onStageChange({ stage: 'interpreterError', errorMessage: item.result.message });
                    return;
                }

                const toLog = { ...item.result, data: dataToString(item.result.data) };
                if (item.result.retCode !== 0) {
                    log.error('interpreter failed: %o', toLog);
                    item.onStageChange({ stage: 'interpreterError', errorMessage: item.result.errorMessage });
                    return;
                }

                log.debug('interpreter result: %o', toLog);

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
        log.debug('executing call service handler %o', req);
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

        log.debug('executed call service handler, req: %o, res: %o ', req, res);
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

async function makeKeyPair(opts?: KeyPairOptions) {
    opts = opts || { type: 'Ed25519', source: 'random' };
    return fromOpts(opts);
}
