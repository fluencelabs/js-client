/*
 * Copyright 2023 Fluence Labs Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// @ts-nocheck
import { PeerIdB58 } from '@fluencelabs/interfaces';
import { fromBase64Sk, KeyPair } from '../keypair/index.js';
import { MarineBackgroundRunner } from '../marine/worker/index.js';

import { WorkerLoaderFromFs } from '../marine/deps-loader/node.js';

import { logger } from '../util/logger.js';
import { Subject } from 'rxjs';
import { Particle } from '../particle/Particle.js';

import { WasmLoaderFromNpm } from '../marine/deps-loader/node.js';
import { MarineBasedAvmRunner } from '../jsPeer/avm.js';
import { DEFAULT_CONFIG, FluencePeer } from '../jsPeer/FluencePeer.js';
import { IConnection } from '../connection/interfaces.js';
import { IAvmRunner, IMarineHost } from '../marine/interfaces.js';
import { JsServiceHost } from '../jsServiceHost/JsServiceHost.js';

const log = logger('ephemeral');

interface EphemeralConfig {
    peers: Array<{
        peerId: PeerIdB58;
        sk: string;
    }>;
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

export interface IEphemeralConnection extends IConnection {
    readonly selfPeerId: PeerIdB58;
    readonly connections: Map<PeerIdB58, IEphemeralConnection>;
    receiveParticle(particle: Particle): void;
}

export class EphemeralConnection implements IConnection, IEphemeralConnection {
    readonly selfPeerId: PeerIdB58;
    readonly connections: Map<PeerIdB58, IEphemeralConnection> = new Map();

    constructor(selfPeerId: PeerIdB58) {
        this.selfPeerId = selfPeerId;
    }

    connectToOther(other: IEphemeralConnection) {
        if (other.selfPeerId === this.selfPeerId) {
            return;
        }

        this.connections.set(other.selfPeerId, other);
        other.connections.set(this.selfPeerId, this);
    }

    disconnectFromOther(other: IEphemeralConnection) {
        this.connections.delete(other.selfPeerId);
        other.connections.delete(this.selfPeerId);
    }

    disconnectFromAll() {
        for (let other of this.connections.values()) {
            this.disconnectFromOther(other);
        }
    }

    particleSource = new Subject<Particle>();

    receiveParticle(particle: Particle): void {
        this.particleSource.next(Particle.fromString(particle.toString()));
    }

    async sendParticle(nextPeerIds: string[], particle: Particle): Promise<void> {
        const from = this.selfPeerId;
        for (let to of nextPeerIds) {
            const destConnection = this.connections.get(to);
            if (destConnection === undefined) {
                log.error('peer %s has no connection with %s', from, to);
                continue;
            }

            // log.trace(`Sending particle from %s, to %j, particleId %s`, from, to, particle.id);
            destConnection.receiveParticle(particle);
        }
    }

    getRelayPeerId(): string {
        if (this.connections.size === 1) {
            return this.connections.keys().next().value;
        }

        throw new Error('relay is not supported in this Ephemeral network peer');
    }

    supportsRelay(): boolean {
        return this.connections.size === 1;
    }
}

class EphemeralPeer extends FluencePeer {
    ephemeralConnection: EphemeralConnection;

    constructor(keyPair: KeyPair, marine: IMarineHost, avm: IAvmRunner) {
        const conn = new EphemeralConnection(keyPair.getPeerId());
        super(DEFAULT_CONFIG, keyPair, marine, new JsServiceHost(), avm, conn);

        this.ephemeralConnection = conn;
    }
}

/**
 * Ephemeral network implementation.
 * Ephemeral network is a virtual network which runs locally and focuses on p2p interaction by removing connectivity layer out of the equation.
 */
export class EphemeralNetwork {
    private peers: Map<PeerIdB58, EphemeralPeer> = new Map();

    workerLoader: WorkerLoaderFromFs;
    controlModuleLoader: WasmLoaderFromNpm;
    avmModuleLoader: WasmLoaderFromNpm;

    constructor(public readonly config: EphemeralConfig) {
        // shared worker for all the peers
        this.workerLoader = new WorkerLoaderFromFs('../../marine/worker-script');
        this.controlModuleLoader = new WasmLoaderFromNpm('@fluencelabs/marine-js', 'marine-js.wasm');
        this.avmModuleLoader = new WasmLoaderFromNpm('@fluencelabs/avm', 'avm.wasm');
    }

    /**
     * Starts the Ephemeral network up
     */
    async up(): Promise<void> {
        log.trace('starting ephemeral network up...');

        const promises = this.config.peers.map(async (x) => {
            const kp = await fromBase64Sk(x.sk);
            const marine = new MarineBackgroundRunner(this.workerLoader, this.controlModuleLoader);
            const avm = new MarineBasedAvmRunner(marine, this.avmModuleLoader);
            const peerId = kp.getPeerId();
            if (peerId !== x.peerId) {
                throw new Error(`Invalid config: peer id ${x.peerId} does not match the secret key ${x.sk}`);
            }

            return new EphemeralPeer(kp, marine, avm);
        });

        const peers = await Promise.all(promises);

        for (let i = 0; i < peers.length; i++) {
            for (let j = 0; j < i; j++) {
                if (i === j) {
                    continue;
                }

                peers[i].ephemeralConnection.connectToOther(peers[j].ephemeralConnection);
            }
        }

        const startPromises = peers.map((x) => x.start());
        await Promise.all(startPromises);

        for (let p of peers) {
            this.peers.set(p.keyPair.getPeerId(), p);
        }
    }

    /**
     * Shuts the ephemeral network down. Will disconnect all connected peers.
     */
    async down(): Promise<void> {
        log.trace('shutting down ephemeral network...');
        const peers = Array.from(this.peers.entries());
        const promises = peers.map(async ([k, p]) => {
            await p.ephemeralConnection.disconnectFromAll();
            await p.stop();
        });

        await Promise.all(promises);
        this.peers.clear();
        log.trace('ephemeral network shut down');
    }

    /**
     * Gets a relay connection to the specified peer.
     */
    getRelayConnection(peerId: PeerIdB58, relayPeerId: PeerIdB58): IConnection {
        const relay = this.peers.get(relayPeerId);
        if (relay === undefined) {
            throw new Error(`Peer ${relayPeerId} is not found`);
        }

        const res = new EphemeralConnection(peerId);
        res.connectToOther(relay.ephemeralConnection);
        return res;
    }
}
