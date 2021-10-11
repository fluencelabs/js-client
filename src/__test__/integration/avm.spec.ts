import { FluencePeer } from '../../index';
import { Particle } from '../../internal/particle';
import { registerHandlersHelper } from '../../internal/utils';

const anotherPeer = new FluencePeer();

describe('Avm spec', () => {
    afterEach(async () => {
        if (anotherPeer) {
            await anotherPeer.stop();
        }
    });

    it('Simple call', async () => {
        // arrange
        await anotherPeer.start();

        // act
        const promise = new Promise<string[]>((resolve, reject) => {
            const script = `
                (call %init_peer_id% ("print" "print") ["1"])
            `;
            const particle = Particle.createNew(script);
            registerHandlersHelper(anotherPeer, particle, {
                print: {
                    print: async (args) => {
                        const [res] = args;
                        resolve(res);
                    },
                },
                _timeout: reject,
            });

            anotherPeer.internals.initiateParticle(particle);
        });

        // assert
        const res = await promise;
        expect(res).toBe('1');
    });

    it('Par call', async () => {
        // arrange
        await anotherPeer.start();

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
            registerHandlersHelper(anotherPeer, particle, {
                print: {
                    print: async (args) => {
                        res.push(args[0]);
                        if (res.length == 2) {
                            resolve(res);
                        }
                    },
                },
                _timeout: reject,
            });

            anotherPeer.internals.initiateParticle(particle);
        });

        // assert
        const res = await promise;
        expect(res).toStrictEqual(['1', '2']);
    });
});
