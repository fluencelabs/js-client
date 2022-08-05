import { EphemeralNetwork, defaultConfig } from '../../internal/ephemeral';
import { FluencePeer, KeyPair } from '../../index';
import { ResultCodes } from '../../internal/commonTypes';

let en: EphemeralNetwork;
let peer: FluencePeer;

describe('Ephemeral networks tests', () => {
    beforeEach(async () => {
        en = new EphemeralNetwork(defaultConfig);
        await en.up();
        const relay = defaultConfig.peers[0].peerId;

        peer = new FluencePeer();
        await peer.init({
            KeyPair: await KeyPair.randomEd25519(),
        });

        const conn = en.getRelayConnection(relay, peer);
        await peer.connect(conn);
    });

    afterEach(async () => {
        if (peer) {
            await peer.stop();
        }
        if (en) {
            await en.down();
        }
    });

    it('smoke test', async function () {
        const relay = peer.getStatus().relayPeerId!;

        const peers = defaultConfig.peers.map((x) => x.peerId);

        const script = `
        (seq 
            (call "${relay}" ("op" "noop") [])
            (seq            
                (call "${peers[0]}" ("op" "noop") [])
                (seq            
                    (call "${peers[1]}" ("op" "noop") [])
                    (seq            
                        (call "${peers[2]}" ("op" "noop") [])
                        (seq            
                            (call "${peers[3]}" ("op" "noop") [])
                            (seq            
                                (call "${peers[4]}" ("op" "noop") [])
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

        const particle = peer.internals.createNewParticle(script);
        if (particle instanceof Error) {
            throw particle;
        }

        const promise = new Promise<string>((resolve) => {
            peer.internals.regHandler.forParticle(particle.id, 'test', 'test', (req) => {
                resolve('success');
                return {
                    result: 'test',
                    retCode: ResultCodes.success,
                };
            });
        });

        peer.internals.initiateParticle(particle, () => {});

        await expect(promise).resolves.toBe('success');
    });
});
