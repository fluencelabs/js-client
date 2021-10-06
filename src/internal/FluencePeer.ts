import {
    AirInterpreter,
    CallRequestsArray,
    CallResultsArray,
    InterpreterResult,
    LogLevel,
    CallServiceResult,
} from '@fluencelabs/avm';
import { Multiaddr } from 'multiaddr';
import { CallServiceData, CallServiceHandler, ResultCodes } from './CallServiceHandler';
import { PeerIdB58 } from './commonTypes';
import makeDefaultClientHandler from './defaultClientHandler';
import { FluenceConnection, FluenceConnectionOptions } from './FluenceConnection';
import { dataToString, Particle } from './particle';
import { KeyPair } from './KeyPair';
import { createInterpreter } from './utils';
import { filter, map, Subject, tap } from 'rxjs';
import { RequestFlow } from './compilerSupport/v1';
import log from 'loglevel';

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

        await this._initAirInterpreter(config?.avmLogLevel || 'off');

        this._callServiceHandler = makeDefaultClientHandler();

        if (config?.connectTo) {
            let theAddress: Multiaddr;
            let fromNode = (config.connectTo as any).multiaddr;
            if (fromNode) {
                theAddress = new Multiaddr(fromNode);
            } else {
                theAddress = new Multiaddr(config.connectTo as string);
            }

            this._relayPeerId = theAddress.getPeerId();
            await this._connect(theAddress);
        }

        this._startInternals();
    }

    /**
     * Un-initializes the peer: stops all the underlying workflows, stops the Aqua VM
     * and disconnects from the Fluence network
     */
    async stop() {
        this._stopInternals();
        this._relayPeerId = null;
        await this._disconnect();
        this._callServiceHandler = null;
    }

    // internal api

    /**
     * Is not intended to be used manually. Subject to change
     */
    get internals() {
        return {
            initiateFlow: (request: RequestFlow): void => {
                if (request.init_peer_id === undefined) {
                    request.init_peer_id = this.getStatus().peerId;
                }
                this._incomingParticles.next(request);
            },
            callServiceHandler: this._callServiceHandler,
        };
    }

    // private

    /**
     *  Used in `isInstance` to check if an object is of type FluencePeer. That's a hack to work around corner cases in JS type system
     */
    private _isFluenceAwesome = true;

    private _incomingParticles = new Subject<Particle>();

    private _startInternals() {
        const particles = new Map<
            string,
            {
                subject: Subject<Particle>;
                meta: Particle['meta'];
            }
        >();

        if (this._connection) {
            this._connection.incomingParticles.subscribe(this._incomingParticles);
        }

        this._incomingParticles
            .pipe(
                tap((x) => x.logTo('debug', 'particle received:')),
                filter((x) => !x.hasExpired()),
                map((x) => x),
            )
            .subscribe((p) => {
                let existing = particles.get(p.id);

                if (!existing) {
                    existing = {
                        subject: new Subject<Particle>(),
                        meta: p.meta,
                    };
                    let prevData: Uint8Array = Buffer.from([]);

                    existing.subject
                        .pipe(
                            filter((x) => !x.hasExpired()),
                            map((x) => x),
                        )
                        .subscribe((x) => {
                            const result = this._runInterpreter(x, prevData);

                            prevData = Buffer.from(result.data);

                            if (result.nextPeerPks.length > 0) {
                                const newP = p.clone();
                                newP.data = prevData;
                                this._connection.outgoingParticles.next(newP);
                            }

                            if (result.callRequests.length > 0) {
                                this._execRequests(x, p.meta, result.callRequests).then((callResults) => {
                                    const newParticle = p.clone();
                                    newParticle.callResults = callResults;
                                    newParticle.data = Buffer.from([]);

                                    existing.subject.next(newParticle);
                                });
                            }
                        });

                    particles.set(p.id, existing);

                    // setTimeout(() => {
                    //     particles.delete(p.id);
                    //     if (p?.meta?.timeout) {
                    //         p.meta.timeout();
                    //     }
                    // }, p.actualTtl());
                }

                existing.subject.next(p);
            });
    }

    private async _execRequests(
        p: Particle,
        meta: Particle['meta'],
        callRequests: CallRequestsArray,
    ): Promise<CallResultsArray> {
        const promises = callRequests.map(([key, callRequest]) => {
            const req = {
                fnName: callRequest.functionName,
                args: callRequest.arguments,
                serviceId: callRequest.serviceId,
                tetraplets: callRequest.tetraplets,
                particleContext: {
                    initPeerId: p.init_peer_id,
                    particleId: p.id,
                    signature: p.signature,
                    timestamp: p.timestamp,
                    ttl: p.ttl,
                },
            };

            const promise = this._execSingleRequest(req, meta).then((res) => [key, res] as const);

            return promise;
        });
        const res: any = await Promise.all(promises);
        p.logTo('debug', 'Executed call service for particle');
        log.debug('Call service results: ', res);
        return res;
    }

    private async _execSingleRequest(req: CallServiceData, meta: Particle['meta']): Promise<CallServiceResult> {
        if (meta?.handler !== undefined) {
            var res = await meta.handler.execute(req);
        }
        // trying particle-specific handler
        if (res?.result === undefined) {
            // if it didn't return any result trying to run the common handler
            res = await this._callServiceHandler.execute(req);
        }

        if (res.retCode === undefined) {
            res = {
                retCode: ResultCodes.unknownError,
                result: `The handler did not set any result. Make sure you are calling the right peer and the handler has been registered. Original request data was: serviceId='${req.serviceId}' fnName='${req.fnName}' args='${req.args}'`,
            };
        }

        if (res.result === undefined) {
            res.result = null;
        }

        return {
            result: JSON.stringify(res.result),
            retCode: res.retCode,
        };
    }

    private _runInterpreter(particle: Particle, prevData: Uint8Array): InterpreterResult {
        particle.logTo('debug', 'Sending particle to interpreter');
        log.debug('prevData: ', dataToString(prevData));
        log.debug('data: ', dataToString(particle.data));
        const interpreterResult = this._interpreter.invoke(
            particle.script,
            prevData,
            particle.data,
            {
                initPeerId: particle.init_peer_id,
                currentPeerId: this.getStatus().peerId,
            },
            particle.callResults,
        );

        const toLog: any = { ...interpreterResult };
        toLog.data = dataToString(toLog.data);
        log.debug('Interpreter result: ', toLog);
        return interpreterResult;
    }

    private _stopInternals() {}

    private _callServiceHandler: CallServiceHandler;

    private _keyPair: KeyPair;
    private _connection: FluenceConnection;
    private _interpreter: AirInterpreter;

    private async _initAirInterpreter(logLevel: AvmLoglevel): Promise<void> {
        this._interpreter = await createInterpreter(logLevel);
    }

    private async _connect(multiaddr: Multiaddr, options?: FluenceConnectionOptions): Promise<void> {
        const nodePeerId = multiaddr.getPeerId();
        if (!nodePeerId) {
            throw Error("'multiaddr' did not contain a valid peer id");
        }

        if (this._connection) {
            await this._connection.disconnect();
        }

        const connection = await FluenceConnection.createConnection({
            peerId: this._keyPair.Libp2pPeerId,
            relayAddress: multiaddr,
            dialTimeout: options?.dialTimeout,
        });

        this._connection = connection;
    }

    private async _disconnect(): Promise<void> {
        if (this._connection) {
            await this._connection.disconnect();
        }
    }

    private _relayPeerId: PeerIdB58 | null = null;
}
