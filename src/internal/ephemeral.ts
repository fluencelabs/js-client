import { PeerIdB58 } from './commonTypes';
import { FluenceConnection, ParticleHandler } from './FluenceConnection';
import { FluencePeer } from '../index';
import { KeyPair } from './KeyPair';
import { toUint8Array } from 'js-base64';

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

const generatedSks = [
    'dWNAHhDVuFj9bEieILMu6TcCFRxBJdOPIvAWmf4sZQI=',
    'dOmaxAeu4Th+MJ22vRDLMFTNbiDgKNXar9fW9ofAMgQ=',
    'TgzaLlxXuOMDNuuuTKEHUKsW0jM4AmX0gahFvkB1KgE=',
    'hiO2Ta8g2ibMQ7iu5yj9CfN+qQCwE8oRShjr7ortKww=',
    'LzJtOHTqxfrlHDW40BKiLfjai8JU4yW6/s2zrXLCcQE=',
    'XMhlk/xr1FPcp7sKQhS18doXlq1x16EMhBC2NGW2LQ4=',
    'KXPAIqxrSHr7v0ngv3qagcqivFvnQ0xd3s1/rKmi8QU=',
    'GCYMAshGnsrNtrHhuT7ayzh5uCzX99J03PmAXoOcCgw=',
    'UP+SEuznS0h259VbFquzyOJAQ4W5iIwhP+hd1PmUQQ0=',
    '8dl+Crm5RSh0eh+LqLKwX8/Eo4QLpvIjfD8L0wzX4A4=',
    'qolc1FcpJ+vHDon0HeXdUYnstjV1wiVx2p0mjblrfAg=',
    'vN6QzWILTM7hSHp+iGkKxiXcqs8bzlnH3FPaRaDGSQY=',
    'YbDQ++bsor2kei7rYAsu2SbyoiOYPRzFRZWnNRUpBgQ=',
    'ptB9eSFMKudAtHaFgDrRK/1oIMrhBujxbMw2Pzwx/wA=',
    'xtwTOKgAbDIgkuPf7RKiR7gYyZ1HY4mOgFMv3sOUcAQ=',
    '1I2MGuiKG1F4FDMiRihVOcOP2mxzOLWJ99MeexK27A4=',
    'eqJ4Bp7iN4aBXgPH0ezwSg+nVsatkYtfrXv9obI0YQ0=',
    'UVM3SBJhPYIY/gafpnd9/q/Fn9V4BE9zkgrvF1T7Pgc=',
    '8RbZfEVpQhPVuhv64uqxENDuSoyJrslQoSQJznxsTQ0=',
    'RbgKmG6soWW9uOi7yRedm+0Qck3f3rw6MSnDP7AcBQs=',
    'R9c4DX+eIP0e9k/EsfRM2dL2nJOHmV6s04RJ0afpyg4=',
    'TFpPX7wEfznbefYjdecip3E/Dv2TmQyf6I3M+CKEowg=',
];

export const generatedSksToNodes = async () => {
    const promises = generatedSks.map(async (x) => {
        const arr = toUint8Array(x);
        const kp = await KeyPair.fromEd25519SK(arr);
        const peerId = kp.toB58String();
        return {
            peerId: peerId,
            multiaddr: '',
        };
    });
    return Promise.all(promises);
};

export const createConfig = async (numberOfPeers: number): Promise<EphemeralConfig> => {
    const candidatePeers = generatedSks.slice(undefined, numberOfPeers);
    const promises = candidatePeers.map((x) => {
        const arr = toUint8Array(x);
        return KeyPair.fromEd25519SK(arr);
    });
    const peers = await Promise.all(promises);

    return {
        peers: peers.map((x) => {
            return {
                peerKp: x,
            };
        }),
    };
};

export class EphemeralNetwork {
    private _ephemeralPeers: Map<PeerIdB58, EphemeralPeer> = new Map();
    private _connectedPeers: Map<PeerIdB58, ConnectedPeer> = new Map();

    constructor(public readonly config: EphemeralConfig) {}

    peersInfo() {
        return Array.from(this._ephemeralPeers.entries()).map(([k, v]) => {
            return {
                peerId: v.peerId,
            };
        });
    }

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
        console.log(`sending particle from ${from}, to ${to}`);
        for (let peerId of to) {
            let peer = this._ephemeralPeers.get(peerId);
            if (peer === undefined) {
                console.log(`peer ${peerId} cannot be found in ephemeral`);
                peer = this._connectedPeers.get(peerId);
                if (peer === undefined) {
                    throw new Error();
                }
            }
            peer.handler(particle);
        }
    }
}
