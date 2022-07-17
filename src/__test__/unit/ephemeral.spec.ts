import { createConfig, EphemeralNetwork } from '../../internal/ephemeral';
import { FluencePeer, KeyPair } from '../../index';
import { Particle } from '../../internal/Particle';
import { ResultCodes } from '../../internal/commonTypes';

describe('Ephemeral networks tests', () => {
    it('smoke test', async function () {
        const config = await createConfig(5);
        const en = new EphemeralNetwork(config);
        await en.up();
        const ephPeers = en.peersInfo().map((x) => x.peerId);
        const relay = ephPeers[0];

        console.log(1);

        const peer = new FluencePeer();
        await peer.init({
            KeyPair: await KeyPair.randomEd25519(),
        });

        console.log(2);

        en.connectToRelay(relay, peer);
        const peerId = peer.getStatus().peerId!;

        console.log(3);

        const script = `
        (seq 
            (call "${relay}" ("op" "noop") [])
            (seq            
                (call "${ephPeers[0]}" ("op" "noop") [])
                (seq            
                    (call "${ephPeers[1]}" ("op" "noop") [])
                    (seq            
                        (call "${ephPeers[2]}" ("op" "noop") [])
                        (seq            
                            (call "${ephPeers[3]}" ("op" "noop") [])
                            (seq            
                                (call "${ephPeers[4]}" ("op" "noop") [])
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

        console.log(4);

        const particle = peer.internals.createNewParticle(script);
        if (particle instanceof Error) {
            throw particle;
        }

        console.log(5);

        const promise = new Promise<string>((resolve) => {
            peer.internals.regHandler.forParticle(particle.id, 'test', 'test', (req) => {
                resolve('success');
                return {
                    result: 'test',
                    retCode: ResultCodes.success,
                };
            });
        });

        console.log(6);

        peer.internals.initiateParticle(particle, () => {});

        await expect(promise).resolves.toBe('success');
    });
});
