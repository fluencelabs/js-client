import { PeerIdB58 } from './commonTypes';
import { FluenceConnection, ParticleHandler } from './FluenceConnection';
import { FluencePeer } from '../index';
import { keyPairFromBase64Sk } from './KeyPair';
import log from 'loglevel';

interface EphemeralConfig {
    peers: Array<{
        peerId: PeerIdB58;
        sk: string;
    }>;
}

interface PeerAdapter {
    isEphemeral: boolean;
    peer: FluencePeer;
    peerId: PeerIdB58;
    onIncoming: ParticleHandler;
    connections: Set<PeerIdB58>;
}

export const defaultConfig = {
    peers: [
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
    ],
};

/**
 * Ephemeral network implementation.
 * Ephemeral network is a virtual network which runs locally and focuses on p2p interaction by removing connectivity layer out of the equation.
 */
export class EphemeralNetwork {
    private _peers: Map<PeerIdB58, PeerAdapter> = new Map();

    constructor(public readonly config: EphemeralConfig) {}

    /**
     * Starts the Ephemeral network up
     */
    async up(): Promise<void> {
        log.debug('Starting ephemeral network up...');
        const allPeerIds = this.config.peers.map((x) => x.peerId);
        const promises = this.config.peers.map(async (x) => {
            const peer = new FluencePeer();
            const sendParticle = async (nextPeerIds: string[], particle: string): Promise<void> => {
                this._send(peer.getStatus().peerId!, nextPeerIds, particle);
            };
            const kp = await keyPairFromBase64Sk(x.sk);
            if (kp.toB58String() !== x.peerId) {
                throw new Error(`Invalid config: peer id ${x.peerId} does not match the secret key ${x.sk}`);
            }

            await peer.init({
                KeyPair: kp,
            });

            let handler: ParticleHandler | null = null;
            const connectionCtor = class extends FluenceConnection {
                relayPeerId = null;

                async connect(onIncomingParticle: ParticleHandler): Promise<void> {
                    handler = onIncomingParticle;
                }

                async disconnect(): Promise<void> {
                    handler = null;
                }

                sendParticle = sendParticle;
            };

            await peer.connect(new connectionCtor());

            const peerId = peer.getStatus().peerId!;
            const ephPeer: PeerAdapter = {
                isEphemeral: true,
                connections: new Set(allPeerIds.filter((x) => x !== peerId)),
                peer: peer,
                peerId: peerId,
                onIncoming: handler!,
            };
            return [peerId, ephPeer] as const;
        });
        const values = await Promise.all(promises);
        this._peers = new Map(values);
        log.debug('Ephemeral network started...');
    }

    /**
     * Shuts the ephemeral network down. Will disconnect all connected peers.
     */
    async down(): Promise<void> {
        log.debug('Shutting down ephemeral network...');
        const peers = Array.from(this._peers.entries());
        const promises = peers.map(([k, p]) => {
            return p.isEphemeral ? p.peer.stop() : p.peer.disconnect();
        });
        await Promise.all(promises);
        this._peers.clear();
        log.debug('Ephemeral network shut down');
    }

    /**
     * Gets the FluenceConnection which can be used to connect to the ephemeral networks via the specified relay peer.
     */
    getRelayConnection(relay: PeerIdB58, peer: FluencePeer): FluenceConnection {
        const me = this;
        const relayPeer = this._peers.get(relay);
        if (relayPeer === undefined) {
            throw new Error(`Relay with peer Id: ${relay} has not been found in ephemeral network`);
        }

        const connectionCtor = class extends FluenceConnection {
            relayPeerId = relay;

            async connect(onIncomingParticle: ParticleHandler): Promise<void> {
                const peerId = peer.getStatus().peerId!;
                me._peers.set(peerId, {
                    isEphemeral: false,
                    peer: peer,
                    onIncoming: onIncomingParticle,
                    peerId: peerId,
                    connections: new Set([relay]),
                });
                relayPeer.connections.add(peerId);
            }

            async disconnect(): Promise<void> {
                const peerId = peer.getStatus().peerId!;
                relayPeer.connections.delete(peerId);
                me._peers.delete(peerId);
            }

            async sendParticle(nextPeerIds: string[], particle: string): Promise<void> {
                const peerId = peer.getStatus().peerId!;
                me._send(peerId, nextPeerIds, particle);
            }
        };

        return new connectionCtor();
    }

    private async _send(from: PeerIdB58, to: PeerIdB58[], particle: string) {
        log.info(`Sending particle from ${from}, to ${JSON.stringify(to)}`);
        const peer = this._peers.get(from);
        if (peer === undefined) {
            log.error(`Peer ${from}  cannot be found in ephemeral network`);
            return;
        }

        for (let dest of to) {
            if (!peer.connections.has(dest)) {
                log.error(`Peer ${from} has no connection with ${dest}`);
                continue;
            }

            const destPeer = this._peers.get(dest);
            if (destPeer === undefined) {
                log.error(`peer ${destPeer} cannot be found in ephemeral network`);
                continue;
            }

            destPeer.onIncoming(particle);
        }
    }
}
