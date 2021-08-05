import { AirInterpreter, CallServiceResult, ParticleHandler, SecurityTetraplet } from '@fluencelabs/avm';
import log from 'loglevel';
import MA from 'multiaddr';
import PeerId, { isPeerId } from 'peer-id';
import { CallServiceHandler } from './CallServiceHandler';
import { PeerIdB58 } from './commonTypes';
import { FluenceConnection, FluenceConnectionOptions } from './FluenceConnection';
import { logParticle, Particle } from './particle';
import { generatePeerId, seedToPeerId } from './peerIdUtils';
import { RequestFlow } from './RequestFlow';
import { loadRelayFn, loadVariablesService } from './RequestFlowBuilder';
import { createInterpreter } from './utils';

export type Multiaddr = string | MA;

export interface InitOptions {
    vmPoolSize?;
    logLevel?;
    defaultTTL?;
    etc?;
    peerIdPk?;
    connectTo: Array<Multiaddr>;
}

interface ConnectionInfo {
    isConnected: Boolean;
    seflPeerId: PeerIdB58;
    connectedRelays: Array<PeerIdB58>;
}

export class FluencePeer {
    async addConnection(relays: Array<Multiaddr>): Promise<void> {}

    async removeConnections(relays: Array<Multiaddr>): Promise<void> {}

    getConnectionInfo(): ConnectionInfo {
        return {
            isConnected: false,
            seflPeerId: this._selfPeerId,
            connectedRelays: this._relayPeerId ? [this._relayPeerId] : [],
        };
    }

    async init(options?: InitOptions): Promise<void> {
        let peerId;
        const peerIdOrSeed = options?.peerIdPk;
        if (!peerIdOrSeed) {
            peerId = await generatePeerId();
        } else if (isPeerId(peerIdOrSeed)) {
            // keep unchanged
            peerId = peerIdOrSeed;
        } else {
            // peerId is string, therefore seed
            peerId = await seedToPeerId(peerIdOrSeed);
        }

        await this._initAirInterpreter();

        if (options?.connectTo) {
            let connectTo = options!.connectTo[0];
            let theAddress: Multiaddr;
            let fromNode = (connectTo as any).multiaddr;
            if (fromNode) {
                theAddress = new MA(fromNode);
            } else {
                theAddress = new MA(connectTo as string);
            }

            await this._connect(theAddress);
        }
    }

    async uninit() {}

    static get default(): FluencePeer {
        return this._default;
    }

    // internal api

    async initiateFlow(request: RequestFlow): Promise<void> {
        // setting `relayVariableName` here. If the client is not connected (i.e it is created as local) then there is no relay
        request.handler.on(loadVariablesService, loadRelayFn, () => {
            return this._relayPeerId || '';
        });
        await request.initState(this.selfPeerIdFull);

        logParticle(log.debug, 'executing local particle', request.getParticle());
        request.handler.combineWith(this.callServiceHandler);
        this._requests.set(request.id, request);

        this._processRequest(request);
    }

    callServiceHandler: CallServiceHandler;

    // private

    private static _default: FluencePeer = new FluencePeer();

    private readonly selfPeerIdFull: PeerId;
    private _requests: Map<string, RequestFlow> = new Map();
    private _currentRequestId: string | null = null;
    private _watchDog;

    private _connection: FluenceConnection;
    private _interpreter: AirInterpreter;

    async _initAirInterpreter(): Promise<void> {
        this._interpreter = await createInterpreter(this._interpreterCallback.bind(this), this._selfPeerId);
    }

    async _connect(multiaddr: string | Multiaddr, options?: FluenceConnectionOptions): Promise<void> {
        multiaddr = MA(multiaddr);

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
            this.selfPeerIdFull,
            this._executeIncomingParticle.bind(this),
        );
        await connection.connect(options);
        this._connection = connection;
        this._initWatchDog();
    }

    async _disconnect(): Promise<void> {
        if (this._connection) {
            await this._connection.disconnect();
        }
        this._clearWathcDog();
        this._requests.forEach((r) => {
            r.cancel();
        });
    }

    get _selfPeerId(): PeerIdB58 {
        return this.selfPeerIdFull.toB58String();
    }

    get _relayPeerId(): PeerIdB58 | undefined {
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
