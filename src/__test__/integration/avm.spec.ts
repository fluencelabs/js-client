import { FluencePeer } from '../../index';
import { Particle } from '../../internal/particle';
import { registerHandlersHelper } from '../util';

describe('Avm spec', () => {
    it('Simple call', async () => {
        // arrange
        const peer = new FluencePeer();
        await peer.start();

        // act
        const promise = new Promise<string[]>((resolve, reject) => {
            const script = `
                (call %init_peer_id% ("print" "print") ["1"])
            `;
            const particle = Particle.createNew(script);
            registerHandlersHelper(peer, particle, {
                print: {
                    print: async (args) => {
                        const [res] = args;
                        resolve(res);
                    },
                },
                _timeout: reject,
            });

            peer.internals.initiateParticle(particle);
        });

        // assert
        const res = await promise;
        expect(res).toBe('1');

        await peer.stop();
    });

    it('Par call', async () => {
        // arrange
        const peer = new FluencePeer();
        await peer.start();

        // act
        const promise = new Promise<string[]>((resolve, reject) => {
            let res = [];
            const script = `
                (seq
                    (par
                        (call %init_peer_id% ("print" "print") ["1"])
                        (null)
                    )
                    (call %init_peer_id% ("print" "print") ["2"])
                )
            `;
            const particle = Particle.createNew(script);
            registerHandlersHelper(peer, particle, {
                print: {
                    print: (args) => {
                        res.push(args[0]);
                        if (res.length == 2) {
                            resolve(res);
                        }
                    },
                },
                _timeout: reject,
            });

            peer.internals.initiateParticle(particle);
        });

        // assert
        const res = await promise;
        expect(res).toStrictEqual(['1', '2']);

        await peer.stop();
    });
});
