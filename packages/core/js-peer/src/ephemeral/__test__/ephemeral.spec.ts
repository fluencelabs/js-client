import { it, describe, expect, beforeEach, afterEach } from 'vitest';
import { DEFAULT_CONFIG, FluencePeer } from '../../jsPeer/FluencePeer.js';
import { CallServiceData, ResultCodes } from '../../jsServiceHost/interface.js';
import { KeyPair } from '../../keypair/index.js';
import { EphemeralNetworkClient } from '../client.js';

import { EphemeralNetwork, defaultConfig } from '../network.js';

let en: EphemeralNetwork;
let client: FluencePeer;
const relay = defaultConfig.peers[0].peerId;

describe('Ephemeral networks tests', () => {
    beforeEach(async () => {
        en = new EphemeralNetwork(defaultConfig);
        await en.up();

        const kp = await KeyPair.randomEd25519();
        client = new EphemeralNetworkClient(DEFAULT_CONFIG, kp, en, relay);
        await client.start();
    });

    afterEach(async () => {
        if (client) {
            await client.stop();
        }
        if (en) {
            await en.down();
        }
    });

    it('smoke test', async function () {
        // arrange
        const peers = defaultConfig.peers.map((x) => x.peerId);

        const script = `
        (seq
            (call "${relay}" ("op" "noop") [])
            (seq
                (call "${peers[1]}" ("op" "noop") [])
                (seq
                    (call "${peers[2]}" ("op" "noop") [])
                    (seq
                        (call "${peers[3]}" ("op" "noop") [])
                        (seq
                            (call "${peers[4]}" ("op" "noop") [])
                            (seq
                                (call "${peers[5]}" ("op" "noop") [])
                                (seq
                                    (call "${relay}" ("op" "noop") [])
                                    (call %init_peer_id% ("test" "test") [])
                                )
                            )
                        )
                    )
                )
            )
        )
        `;

        const particle = client.internals.createNewParticle(script);

        const promise = new Promise<string>((resolve) => {
            client.internals.regHandler.forParticle(particle.id, 'test', 'test', (req: CallServiceData) => {
                resolve('success');
                return {
                    result: 'test',
                    retCode: ResultCodes.success,
                };
            });
        });

        // act
        client.internals.initiateParticle(particle, () => {});

        // assert
        await expect(promise).resolves.toBe('success');
    }, 20000);
});
