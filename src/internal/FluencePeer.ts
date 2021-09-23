import { AirInterpreter, LogLevel } from '@fluencelabs/avm';
import { match } from 'ts-pattern';
import { Multiaddr } from 'multiaddr';
import { CallServiceHandler } from './CallServiceHandler';
import { PeerIdB58 } from './commonTypes';
import makeDefaultClientHandler from './defaultClientHandler';
import { FluenceConnection, FluenceConnectionOptions } from './FluenceConnection';
import { Particle } from './particle';
import { KeyPair } from './KeyPair';
import { createInterpreter } from './utils';
import { ParticleOp, ParticleExecFlow } from './ParticleExecFlow';
import { filter, map, mergeMap, Subject, timer } from 'rxjs';
import { RequestFlow } from './compilerSupport/v1';

/**
 * Node of the Fluence detwork specified as a pair of node's multiaddr and it's peer id
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
     * Uninitializes the peer: stops all the underltying workflows, stops the Aqua VM
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
     * Does not intended to be used manually. Subject to change
     */
    get internals() {
        return {
            initiateFlow: (reqest: RequestFlow) => {
                this._executingQueue.next({ op: 'incoming', particle: reqest.getParticle() });
            },
            callServiceHandler: this._callServiceHandler,
        };
    }

    // private

    /**
     *  Used in `isInstance` to check if an object is of type FluencePeer. That's a hack to work around corner cases in JS type system
     */
    private _isFluenceAwesome = true;

    private _executingQueue = new Subject<ParticleOp>();

    private _startInternals() {
        this._connection.incomingParticles
            .pipe(
                map((x) => ({
                    op: 'incoming' as const,
                    particle: x,
                })),
            )
            .subscribe(this._executingQueue);

        this._connection.incomingParticles
            .pipe(
                filter((x) => !x.hasExpired()),
                mergeMap((x) =>
                    // force new line
                    timer(x.actualTtl()).pipe(
                        map((_) => ({
                            op: 'expired' as const,
                            particleId: x.id,
                        })),
                    ),
                ),
            )
            .subscribe(this._executingQueue);

        this._executingQueue.subscribe(this._processParticle);
    }

    private _state = new Map<string, ParticleExecFlow>();

    private _processParticle(particle: ParticleOp) {
        match(particle)
            .with({ op: 'incoming' }, ({ particle }) => {
                let ef = this._state.get(particle.id);
                if (ef) {
                    ef.mergeWithIncoming(particle);
                } else {
                    ef = new ParticleExecFlow(particle);
                    this._state.set(particle.id, ef);
                }

                this._executingQueue.next({
                    op: 'shouldCallInterpreter',
                    particleId: particle.id,
                });
            })
            .with({ op: 'expired' }, ({ particleId }) => {
                this._state.delete(particleId);
            })
            .with({ op: 'callbackFinished' }, (x) => {
                const ef = this._state.get(x.particleId);
                if (ef) {
                    ef.mergeInterpreterResult;
                }
            })
            .with({ op: 'interpreterResult' }, ({ particleId, interpreterResult }) => {
                const ef = this._state.get(particleId);
                if (ef) {
                    ef.mergeInterpreterResult(interpreterResult);
                }
                if (ef.processingDone()) {
                    this._connection.outgoingParticles.next(ef.getParticle());
                } else {
                    this._executingQueue.next({
                        op: 'shouldCallInterpreter',
                        particleId: particleId,
                    });
                }
            })
            .with({ op: 'shouldCallInterpreter' }, ({ particleId }) => {
                const ef = this._state.get(particleId);
                if (ef) {
                    ef.mergeInterpreterResult;
                }
                const res = this._runInterpreter(ef.getParticle(), ef.prevData, ef.callResults);
                this._executingQueue.next(res);
            })
            .exhaustive();
    }

    private _runInterpreter(particle: Particle, prevData, callResults): ParticleOp {
        const interpreterResult = this._interpreter.invoke(
            particle.script,
            prevData,
            particle.data,
            {
                initPeerId: particle.init_peer_id,
                currentPeerId: this.getStatus().peerId,
            },
            callResults,
        );

        return {
            op: 'interpreterResult',
            particleId: particle.id,
            interpreterResult: interpreterResult,
        };
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
