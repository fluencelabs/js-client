import { PeerIdB58 } from './commonTypes';
import { FluenceConnection, ParticleHandler } from './FluenceConnection';
import { FluencePeer } from './FluencePeer';
import { KeyPair } from './KeyPair';

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

    async up(): Promise<void> {
        const me = this;
        const promises = this.config.peers.map(async (x) => {
            const peer = new FluencePeer();
            await peer.init({
                KeyPair: x.peerKp,
            });

            let handler: ParticleHandler | null = null;
            const connection = new (class extends FluenceConnection {
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

            await peer.connect(connection);

            const peerId = peer.getStatus().peerId!;
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

    async connectToRelay(relay: PeerIdB58, peer: FluencePeer): Promise<void> {
        const me = this;
        let handler: ParticleHandler | null = null;
        const connection = new (class extends FluenceConnection {
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

        await peer.connect(connection);

        const peerId = peer.getStatus().peerId!;

        this._connectedPeers.set(peerId, {
            peer: peer,
            handler: handler!,
            peerId: peerId,
            relay: relay,
        });
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
