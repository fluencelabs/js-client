import Relay from 'libp2p/src/circuit';
import { PeerIdB58 } from './commonTypes';
import { FluenceConnection, ParticleHandler } from './FluenceConnection';
import { FluencePeer } from './FluencePeer';
import { KeyPair } from './KeyPair';
import { throwIfNotSupported } from './utils';

interface EphemeralConfig {
    peers: Array<{
        peerKp: KeyPair;
    }>;
}

interface EphemeralPeer {
    peerId: PeerIdB58;
    peer: FluencePeer;
    handler: ParticleHandler;
}

interface ConnectedPeer {
    peerId: PeerIdB58;
    peer: FluencePeer;
    handler: ParticleHandler;
    relay: PeerIdB58;
}

export class EphemeralNetwork {
    private _ephemeralPeers: Map<PeerIdB58, EphemeralPeer> = new Map();
    private _connectedPeers: Map<PeerIdB58, ConnectedPeer> = new Map();

    constructor(public readonly config: EphemeralConfig) {}

    /*
    static async create(config: EphemeralConfig): Promise<EphemeralNetwork> {
        let res: EphemeralNetwork | null = null;

        const promises = new Array(count).map(async (x) => {
            const peer = new FluencePeer();
            let handler: ParticleHandler | null = null;
            const connection = new (class extends FluenceConnection {
                peerId: string = '';
                async connect(onIncomingParticle: ParticleHandler): Promise<void> {
                    handler = onIncomingParticle;
                }
                async disconnect(): Promise<void> {
                    handler = null;
                }
                async sendParticle(nextPeerIds: string[], particle: string): Promise<void> {
                    res!.send(this.peerId, nextPeerIds, particle);
                }
            })();

            await peer.start({
                connectTo: connection,
            });
            const peerId = peer.getStatus().peerId!;
            connection.peerId = peerId;
            const ephPeer: EphemeralPeer = {
                peer: peer,
                peerId: peerId,
                handler: handler!,
            };
            return [peerId, ephPeer] as const;
        });
        const values = await Promise.all(promises);

        const peers = new Map(values);

        res = new EphemeralNetwork(peers);
        return res;
    }
    */

    async up(): Promise<void> {
        const me = this;
        const promises = this.config.peers.map(async (x) => {
            const peer = new FluencePeer();
            let handler: ParticleHandler | null = null;
            const connection = new (class extends FluenceConnection {
                // peerId: string = '';
                async connect(onIncomingParticle: ParticleHandler): Promise<void> {
                    handler = onIncomingParticle;
                }
                async disconnect(): Promise<void> {
                    handler = null;
                }
                async sendParticle(nextPeerIds: string[], particle: string): Promise<void> {
                    me.send(peer.getStatus().peerId!, nextPeerIds, particle);
                }
            })();

            await peer.start({
                connectTo: connection,
                KeyPair: x.peerKp,
            });
            const peerId = peer.getStatus().peerId!;
            // connection.peerId = peerId;
            const ephPeer: EphemeralPeer = {
                peer: peer,
                peerId: peerId,
                handler: handler!,
            };
            return [peerId, ephPeer] as const;
        });
        const values = await Promise.all(promises);
        this._ephemeralPeers = new Map(values);
    }

    createRelayConnection(relay: PeerIdB58): FluenceConnection {
        const me = this;
        let handler: ParticleHandler | null = null;
        const res = new (class extends FluenceConnection {
            // peerId: string;
            async connect(onIncomingParticle: ParticleHandler): Promise<void> {
                handler = onIncomingParticle;
            }
            async disconnect(): Promise<void> {
                handler = null;
            }
            async sendParticle(nextPeerIds: string[], particle: string): Promise<void> {
                me.send('', nextPeerIds, particle);
            }
        })();

        this._connectedPeers.set();

        return res;
    }

    async down(): Promise<void> {
        const elements = Array.from(this._ephemeralPeers.entries());
        const promises = elements.map(([k, p]) => {
            return p.peer.stop();
        });
        await Promise.all(promises);
        this._ephemeralPeers.clear();
    }

    async send(from: PeerIdB58, to: PeerIdB58[], particle: string) {
        for (let peerId in to) {
            const peer = this._ephemeralPeers.get(peerId);
            if (peer === undefined) {
                throw new Error();
            } else {
                peer.handler(particle);
            }
        }
    }
}
