import { PeerIdB58 } from './commonTypes';
import { FluenceConnection, ParticleHandler } from './FluenceConnection';
import { FluencePeer } from '../index';
import { KeyPair } from './KeyPair';
import { toUint8Array } from 'js-base64';

interface EphemeralConfig {
    peers: Array<{
        peerId: PeerIdB58;
        keyPair: KeyPair;
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

export const preGeneratedPeers = [
    {
        peerId: '12D3KooWJankP2PcEDYCZDdJ26JsU8BMRfdGWyGqbtFiWyoKVtmx',
        sk: 'dWNAHhDVuFj9bEieILMu6TcCFRxBJdOPIvAWmf4sZQI=',
    },
    {
        peerId: '12D3KooWSBTB5sYxdwayUyTnqopBwABsnGFY3p4dTx5hABYDtJjV',
        sk: 'dOmaxAeu4Th+MJ22vRDLMFTNbiDgKNXar9fW9ofAMgQ=',
    },
    {
        peerId: '12D3KooWQjwf781DJ41moW5RrZXypLdnTbo6aMsoA8QLctGGX8RB',
        sk: 'TgzaLlxXuOMDNuuuTKEHUKsW0jM4AmX0gahFvkB1KgE=',
    },
    {
        peerId: '12D3KooWCXWTLFyY1mqKnNAhLQTsjW1zqDzCMbUs8M4a8zdz28HK',
        sk: 'hiO2Ta8g2ibMQ7iu5yj9CfN+qQCwE8oRShjr7ortKww=',
    },
    {
        peerId: '12D3KooWPmZpf4ng6GMS39HLagxsXbjiTPLH5CFJpFAHyN6amw6V',
        sk: 'LzJtOHTqxfrlHDW40BKiLfjai8JU4yW6/s2zrXLCcQE=',
    },
    {
        peerId: '12D3KooWKrx8PZxM1R9A8tp2jmrFf6c6q1ZQiWfD4QkNgh7fWSoF',
        sk: 'XMhlk/xr1FPcp7sKQhS18doXlq1x16EMhBC2NGW2LQ4=',
    },
    {
        peerId: '12D3KooWCbJHvnzSZEXjR1UJmtSUozuJK13iRiCYHLN1gjvm4TZZ',
        sk: 'KXPAIqxrSHr7v0ngv3qagcqivFvnQ0xd3s1/rKmi8QU=',
    },
    {
        peerId: '12D3KooWEvKe7WQHp42W4xhHRgTAWQjtDWyH38uJbLHAsMuTtYvD',
        sk: 'GCYMAshGnsrNtrHhuT7ayzh5uCzX99J03PmAXoOcCgw=',
    },
    {
        peerId: '12D3KooWSznSHN3BGrSykBXkLkFsqo9SYB73wVauVdqeuRt562cC',
        sk: 'UP+SEuznS0h259VbFquzyOJAQ4W5iIwhP+hd1PmUQQ0=',
    },
    {
        peerId: '12D3KooWF57jwbShfnT3c4dNfRDdGjr6SQ3B71m87UVpEpSWHFwi',
        sk: '8dl+Crm5RSh0eh+LqLKwX8/Eo4QLpvIjfD8L0wzX4A4=',
    },
    {
        peerId: '12D3KooWBWrzpSg9nwMLBCa2cJubUjTv63Mfy6PYg9rHGbetaV5C',
        sk: 'qolc1FcpJ+vHDon0HeXdUYnstjV1wiVx2p0mjblrfAg=',
    },
    {
        peerId: '12D3KooWNkLVU6juM8oyN2SVq5nBd2kp7Rf4uzJH1hET6vj6G5j6',
        sk: 'vN6QzWILTM7hSHp+iGkKxiXcqs8bzlnH3FPaRaDGSQY=',
    },
    {
        peerId: '12D3KooWKo1YwGL5vivPiKJMJS7wjtB6B2nJNdSXPkSABT4NKBUU',
        sk: 'YbDQ++bsor2kei7rYAsu2SbyoiOYPRzFRZWnNRUpBgQ=',
    },
    {
        peerId: '12D3KooWLUyBKmmNCyxaPkXoWcUFPcy5qrZsUo2E1tyM6CJmGJvC',
        sk: 'ptB9eSFMKudAtHaFgDrRK/1oIMrhBujxbMw2Pzwx/wA=',
    },
    {
        peerId: '12D3KooWAEZXME4KMu9FvLezsJWDbYFe2zyujyMnDT1AgcAxgcCk',
        sk: 'xtwTOKgAbDIgkuPf7RKiR7gYyZ1HY4mOgFMv3sOUcAQ=',
    },
    {
        peerId: '12D3KooWEhXetsFVAD9h2dRz9XgFpfidho1TCZVhFrczX8h8qgzY',
        sk: '1I2MGuiKG1F4FDMiRihVOcOP2mxzOLWJ99MeexK27A4=',
    },
    {
        peerId: '12D3KooWDBfVNdMyV3hPEF4WLBmx9DwD2t2SYuqZ2mztYmDzZWM1',
        sk: 'eqJ4Bp7iN4aBXgPH0ezwSg+nVsatkYtfrXv9obI0YQ0=',
    },
    {
        peerId: '12D3KooWSyY7wiSiR4vbXa1WtZawi3ackMTqcQhEPrvqtagoWPny',
        sk: 'UVM3SBJhPYIY/gafpnd9/q/Fn9V4BE9zkgrvF1T7Pgc=',
    },
    {
        peerId: '12D3KooWFZmBMGG9PxTs9s6ASzkLGKJWMyPheA5ruaYc2FDkDTmv',
        sk: '8RbZfEVpQhPVuhv64uqxENDuSoyJrslQoSQJznxsTQ0=',
    },
    {
        peerId: '12D3KooWBbhUaqqur6KHPunnKxXjY1daCtqJdy4wRji89LmAkVB4',
        sk: 'RbgKmG6soWW9uOi7yRedm+0Qck3f3rw6MSnDP7AcBQs=',
    },
    {
        peerId: '12D3KooWBYqd5K4BcgNWpp1zAGoDnffrAiiwCRX4VmGRqdtZiGNa',
        sk: 'R9c4DX+eIP0e9k/EsfRM2dL2nJOHmV6s04RJ0afpyg4=',
    },
    {
        peerId: '12D3KooWCS6MvbxmRD7qfWEAcxx66VphkknFEWDbQAxZhj2UpkNc',
        sk: 'TFpPX7wEfznbefYjdecip3E/Dv2TmQyf6I3M+CKEowg=',
    },
];

export const createConfig = async (numberOfPeers: number): Promise<EphemeralConfig> => {
    const candidatePeers = preGeneratedPeers.slice(0, numberOfPeers);
    const promises = candidatePeers.map(async (x) => {
        const arr = toUint8Array(x.sk);
        const kp = await KeyPair.fromEd25519SK(arr);
        return {
            peerId: x.peerId,
            keyPair: kp,
        };
    });
    const peers = await Promise.all(promises);

    return {
        peers,
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
                KeyPair: x.keyPair,
            });

            let handler: ParticleHandler | null = null;
            const connection = new (class extends FluenceConnection {
                relayPeerId = null;
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
            relayPeerId = relay;
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
