import { AirInterpreter, CallServiceResult, LogLevel, ParticleHandler, SecurityTetraplet } from '@fluencelabs/avm';
import log from 'loglevel';
import { Multiaddr } from 'multiaddr';
import PeerId from 'peer-id';
import { CallServiceHandler } from './CallServiceHandler';
import { PeerIdB58 } from './commonTypes';
import makeDefaultClientHandler from './defaultClientHandler';
import { FluenceConnection, FluenceConnectionOptions } from './FluenceConnection';
import { logParticle, Particle } from './particle';
import { KeyPair } from './KeyPair';
import { RequestFlow } from './RequestFlow';
import { loadRelayFn, loadVariablesService } from './RequestFlowBuilder';
import { createInterpreter } from './utils';

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
     * Get the peer's status
     */
    getStatus(): PeerStatus {
        const isConnected = this._connection?.isConnected();
        const hasKeyPair = this._keyPair !== undefined;
        return {
            isInitialized: hasKeyPair,
            isConnected: isConnected,
            peerId: this._selfPeerId,
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

            await this._connect(theAddress);
        }
    }

    /**
     * Uninitializes the peer: stops all the underltying workflows, stops the Aqua VM
     * and disconnects from the Fluence network
     */
    async stop() {
        await this._disconnect();
        this._callServiceHandler = null;
    }

    // internal api

    /**
     * Does not intended to be used manually. Subject to change
     */
    get internals() {
        return {
            initiateFlow: this._initiateFlow.bind(this),
            callServiceHandler: this._callServiceHandler,
        };
    }

    // private

    private async _initiateFlow(request: RequestFlow): Promise<void> {
        // setting `relayVariableName` here. If the client is not connected (i.e it is created as local) then there is no relay
        request.handler.on(loadVariablesService, loadRelayFn, () => {
            return this._relayPeerId || '';
        });
        await request.initState(this._keyPair.Libp2pPeerId);

        logParticle(log.debug, 'executing local particle', request.getParticle());
        request.handler.combineWith(this._callServiceHandler);
        this._requests.set(request.id, request);

        this._processRequest(request);
    }

    private _callServiceHandler: CallServiceHandler;

    private _keyPair: KeyPair;
    private _requests: Map<string, RequestFlow> = new Map();
    private _currentRequestId: string | null = null;
    private _watchdog;

    private _connection: FluenceConnection;
    private _interpreter: AirInterpreter;

    private async _initAirInterpreter(logLevel: AvmLoglevel): Promise<void> {
        this._interpreter = await createInterpreter(this._interpreterCallback.bind(this), this._selfPeerId, logLevel);
    }

    private async _connect(multiaddr: Multiaddr, options?: FluenceConnectionOptions): Promise<void> {
        const nodePeerId = multiaddr.getPeerId();
        if (!nodePeerId) {
            throw Error("'multiaddr' did not contain a valid peer id");
        }

        if (this._connection) {
            await this._connection.disconnect();
        }

        const node = PeerId.createFromB58String(nodePeerId);
        const connection = new FluenceConnection(
            multiaddr,
            node,
            this._keyPair.Libp2pPeerId,
            this._executeIncomingParticle.bind(this),
        );
        await connection.connect(options);
        this._connection = connection;
        this._initWatchDog();
    }

    private async _disconnect(): Promise<void> {
        if (this._connection) {
            await this._connection.disconnect();
        }
        this._clearWathcDog();
        this._requests.forEach((r) => {
            r.cancel();
        });
    }

    private get _selfPeerId(): PeerIdB58 {
        return this._keyPair.Libp2pPeerId.toB58String();
    }

    private get _relayPeerId(): PeerIdB58 | undefined {
        return this._connection?.nodePeerId.toB58String();
    }

    private async _executeIncomingParticle(particle: Particle) {
        logParticle(log.debug, 'incoming particle received', particle);

        let request = this._requests.get(particle.id);
        if (request) {
            await request.receiveUpdate(particle);
        } else {
            request = RequestFlow.createExternal(particle);
            request.handler.combineWith(this._callServiceHandler);
        }
        this._requests.set(request.id, request);

        await this._processRequest(request);
    }

    private _processRequest(request: RequestFlow) {
        try {
            this._currentRequestId = request.id;
            request.execute(this._interpreter, this._connection, this._relayPeerId);
        } catch (err) {
            log.error('particle processing failed: ' + err);
        } finally {
            this._currentRequestId = null;
        }
    }

    private _interpreterCallback: ParticleHandler = (
        serviceId: string,
        fnName: string,
        args: any[],
        tetraplets: SecurityTetraplet[][],
    ): CallServiceResult => {
        if (this._currentRequestId === null) {
            throw Error('current request can`t be null here');
        }

        const request = this._requests.get(this._currentRequestId);
        const particle = request.getParticle();
        if (particle === null) {
            throw new Error("particle can't be null here, current request id: " + this._currentRequestId);
        }
        const res = request.handler.execute({
            serviceId,
            fnName,
            args,
            tetraplets,
            particleContext: {
                particleId: request.id,
                initPeerId: particle.init_peer_id,
                timestamp: particle.timestamp,
                ttl: particle.ttl,
                signature: particle.signature,
            },
        });

        if (res.result === undefined) {
            log.error(
                `Call to serviceId=${serviceId} fnName=${fnName} unexpectedly returned undefined result, falling back to null. Particle id=${request.id}`,
            );
            res.result = null;
        }

        return {
            ret_code: res.retCode,
            result: JSON.stringify(res.result),
        };
    };

    private _initWatchDog() {
        this._watchdog = setInterval(() => {
            for (let key in this._requests.keys) {
                if (this._requests.get(key).hasExpired()) {
                    this._requests.delete(key);
                }
            }
        }, 5000); // TODO: make configurable
    }

    private _clearWathcDog() {
        clearInterval(this._watchdog);
    }
}
