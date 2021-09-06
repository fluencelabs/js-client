import { AirInterpreter, CallServiceResult, InterpreterResult, LogLevel, SecurityTetraplet } from '@fluencelabs/avm';
import log from 'loglevel';
import { Multiaddr as MA } from 'multiaddr';
import PeerId, { isPeerId } from 'peer-id';
import { CallServiceHandler } from './CallServiceHandler';
import { PeerIdB58 } from './commonTypes';
import makeDefaultClientHandler from './defaultClientHandler';
import { FluenceConnection, FluenceConnectionOptions } from './FluenceConnection';
import { logParticle, Particle } from './particle';
import { randomPeerId, peerIdFromEd25519SK } from './peerIdUtils';
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
 * Represents all the possible types which can used to specify the connection point. Can be in the form of:
 * * string - multiaddr in string format
 * * Multiaddr - multiaddr object, @see https://github.com/multiformats/js-multiaddr
 * * Node - node structure, @see Node
 */
export type ConnectionSpec = string | MA | Node;

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
     * If not specified the will work locally and would not be able to send or receive particles.
     */
    connectTo?: ConnectionSpec | Array<ConnectionSpec>;

    avmLogLevel?: AvmLoglevel;

    /**
     * Specify the peer id to be used to identify the Fluence Peer .
     * Specified either as PeerId structure or as seed string
     * Will be generated randomly if not specified
     */
    peerId?: string;

    /**
     * When the peer established the connection to the network it sends a ping-like message to check if it works correctly.
     * The options allows to specify the timeout for that message in milliseconds.
     * If not specified the default timeout will be used
     */
    checkConnectionTimoutMs?: number;

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
interface ConnectionInfo {
    /**
     * Is the peer connected to network or not
     */
    isConnected: Boolean;

    /**
     * The Peer's identification in the Fluence network
     */
    selfPeerId: PeerIdB58;

    /**
     * The list of relays's peer ids to which the peer is connected to
     */
    connectedRelays: Array<PeerIdB58>;
}

/**
 * This class implements the Fluence protocol for javascript-based environments.
 * It provides all the necessary features to communicate with Fluence network
 */
export class FluencePeer {
    // TODO:: implement api alongside with multi-relay implementation
    //async addConnection(relays: Array<ConnectionSpec>): Promise<void> {}

    // TODO:: implement api alongside with multi-relay implementation
    //async removeConnections(relays: Array<ConnectionSpec>): Promise<void> {}

    /**
     * Creates a new Fluence Peer instance. Does not start the workflows.
     * In order to work with the Peer it has to be initialized with the `init` method
     */
    constructor() {}

    /**
     * Get the information about Fluence Peer connections
     */
    get connectionInfo(): ConnectionInfo {
        const isConnected = this._connection?.isConnected();
        return {
            isConnected: isConnected,
            selfPeerId: this._selfPeerId,
            connectedRelays: this._relayPeerId ? [this._relayPeerId] : [],
        };
    }

    /**
     * Initializes the peer: starts the Aqua VM, initializes the default call service handlers
     * and (optionally) connect to the Fluence network
     * @param config - object specifying peer configuration
     */
    async init(config?: PeerConfig): Promise<void> {
        let peerId;
        const peerIdOrSeed = config?.peerId;
        if (!peerIdOrSeed) {
            peerId = await randomPeerId();
        } else if (isPeerId(peerIdOrSeed)) {
            // keep unchanged
            peerId = peerIdOrSeed;
        } else {
            // peerId is string, therefore seed
            peerId = await peerIdFromEd25519SK(peerIdOrSeed);
        }
        this._selfPeerIdFull = peerId;

        await this._initAirInterpreter(config?.avmLogLevel || 'off');

        this._callServiceHandler = makeDefaultClientHandler();

        if (config?.connectTo) {
            let connectTo;
            if (Array.isArray(config!.connectTo)) {
                connectTo = config!.connectTo;
            } else {
                connectTo = [config!.connectTo];
            }

            let theAddress: ConnectionSpec;
            let fromNode = (connectTo[0] as any).multiaddr;
            if (fromNode) {
                theAddress = new MA(fromNode);
            } else {
                theAddress = new MA(connectTo[0] as string);
            }

            await this._connect(theAddress);
        }
    }

    /**
     * Uninitializes the peer: stops all the underltying workflows, stops the Aqua VM
     * and disconnects from the Fluence network
     */
    async uninit() {
        await this._disconnect();
        this._callServiceHandler = null;
    }

    /**
     * Get the default Fluence peer instance. The default peer is used automatically in all the functions generated
     * by the Aqua compiler if not specified otherwise.
     */
    static get default(): FluencePeer {
        return this._default;
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
        request.handler.on(loadVariablesService, loadRelayFn, async () => {
            return this._relayPeerId || '';
        });
        await request.initState(this._selfPeerIdFull);

        logParticle(log.debug, 'executing local particle', request.getParticle());
        request.handler.combineWith(this._callServiceHandler);
        this._requests.set(request.id, request);

        await this._processRequest(request);
    }

    private _callServiceHandler: CallServiceHandler;

    private static _default: FluencePeer = new FluencePeer();

    private _selfPeerIdFull: PeerId;
    private _requests: Map<string, RequestFlow> = new Map();
    private _watchDog;

    private _connection: FluenceConnection;
    private _interpreter: AirInterpreter;

    private async _initAirInterpreter(logLevel: AvmLoglevel): Promise<void> {
        this._interpreter = await createInterpreter(logLevel);
    }

    private async _connect(multiaddr: MA, options?: FluenceConnectionOptions): Promise<void> {
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
            this._selfPeerIdFull,
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
        return this._selfPeerIdFull.toB58String();
    }

    private get _relayPeerId(): PeerIdB58 | undefined {
        return this._connection?.nodePeerId.toB58String();
    }

    private async _executeIncomingParticle(particle: Particle) {
        logParticle(log.debug, 'external particle received', particle);

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

    private async _processRequest(request: RequestFlow) {
        try {
            await request.execute(this._interpreter, this._connection, this._selfPeerId, this._relayPeerId);
        } catch (err) {
            log.error('particle processing failed: ' + err);
        }
    }

    private _initWatchDog() {
        this._watchDog = setInterval(() => {
            for (let key in this._requests.keys) {
                if (this._requests.get(key).hasExpired()) {
                    this._requests.delete(key);
                }
            }
        }, 5000);
    }

    private _clearWathcDog() {
        clearInterval(this._watchDog);
    }
}
