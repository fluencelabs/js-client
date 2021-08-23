import { AirInterpreter, CallServiceResult, LogLevel, ParticleHandler, SecurityTetraplet } from '@fluencelabs/avm';
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

type Node = {
    peerId: string;
    multiaddr: string;
};

export type ConnectionSpec = string | MA | Node;

export type AvmLoglevel = LogLevel;

export interface InitOptions {
    connectTo?: ConnectionSpec | Array<ConnectionSpec>;
    avmLogLevel?: AvmLoglevel;
    peerIdSK?: string;
    checkConnectionTTLMs?: number;
    skipCheckConnection?: boolean;
    dialTimeoutMs?: number;
}

interface ConnectionInfo {
    isConnected: Boolean;
    selfPeerId: PeerIdB58;
    connectedRelays: Array<PeerIdB58>;
}

export class FluencePeer {
    // TODO:: implement api alongside with multi-relay implementation
    //async addConnection(relays: Array<ConnectionSpec>): Promise<void> {}

    // TODO:: implement api alongside with multi-relay implementation
    //async removeConnections(relays: Array<ConnectionSpec>): Promise<void> {}

    get connectionInfo(): ConnectionInfo {
        const isConnected = this._connection?.isConnected();
        return {
            isConnected: isConnected,
            selfPeerId: this._selfPeerId,
            connectedRelays: this._relayPeerId ? [this._relayPeerId] : [],
        };
    }

    async init(options?: InitOptions): Promise<void> {
        let peerId;
        const peerIdOrSeed = options?.peerIdSK;
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

        await this._initAirInterpreter(options?.avmLogLevel || 'off');

        this.callServiceHandler = makeDefaultClientHandler();

        if (options?.connectTo) {
            let connectTo;
            if (Array.isArray(options!.connectTo)) {
                connectTo = options!.connectTo;
            } else {
                connectTo = [options!.connectTo];
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

    async uninit() {
        await this._disconnect();
        this.callServiceHandler = null;
    }

    static get default(): FluencePeer {
        return this._default;
    }

    // internal api

    async initiateFlow(request: RequestFlow): Promise<void> {
        // setting `relayVariableName` here. If the client is not connected (i.e it is created as local) then there is no relay
        request.handler.on(loadVariablesService, loadRelayFn, () => {
            return this._relayPeerId || '';
        });
        await request.initState(this._selfPeerIdFull);

        logParticle(log.debug, 'executing local particle', request.getParticle());
        request.handler.combineWith(this.callServiceHandler);
        this._requests.set(request.id, request);

        this._processRequest(request);
    }

    callServiceHandler: CallServiceHandler;

    // private

    private static _default: FluencePeer = new FluencePeer();

    private _selfPeerIdFull: PeerId;
    private _requests: Map<string, RequestFlow> = new Map();
    private _currentRequestId: string | null = null;
    private _watchDog;

    private _connection: FluenceConnection;
    private _interpreter: AirInterpreter;

    private async _initAirInterpreter(logLevel: AvmLoglevel): Promise<void> {
        this._interpreter = await createInterpreter(this._interpreterCallback.bind(this), this._selfPeerId, logLevel);
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
            request.receiveUpdate(particle);
        } else {
            request = RequestFlow.createExternal(particle);
            request.handler.combineWith(this.callServiceHandler);
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
            throw new Error("particle can't be null here");
        }
        const res = request.handler.execute({
            serviceId,
            fnName,
            args,
            tetraplets,
            particleContext: {
                particleId: request.id,
                initPeerId: particle.init_peer_id,
                timeStamp: particle.timestamp,
                ttl: particle.ttl,
                signature: particle.signature,
            },
        });

        if (res.result === undefined) {
            log.error(
                `Call to serviceId=${serviceId} fnName=${fnName} unexpectedly returned undefined result, falling back to null`,
            );
            res.result = null;
        }

        return {
            ret_code: res.retCode,
            result: JSON.stringify(res.result),
        };
    };

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
