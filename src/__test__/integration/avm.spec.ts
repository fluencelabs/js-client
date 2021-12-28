import { FluencePeer, setLogLevel } from '../../index';
import { Particle } from '../../internal/Particle';
import { handleTimeout } from '../../internal/utils';
import { registerHandlersHelper } from '../util';

let peer: FluencePeer;

describe('Avm spec', () => {
    afterEach(async () => {
        if (peer) {
            await peer.stop();
        }
    });

    beforeEach(() => {
        peer = new FluencePeer();
    });

    it('Simple call', async () => {
        // arrange
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
            });

            peer.internals.initiateParticle(particle, handleTimeout(reject));
        });

        // assert
        const res = await promise;
        expect(res).toBe('1');

        await peer.stop();
    });

    it('Par call', async () => {
        // arrange
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
            });

            peer.internals.initiateParticle(particle, handleTimeout(reject));
        });

        // assert
        const res = await promise;
        expect(res).toStrictEqual(['1', '2']);

        await peer.stop();
    });

    it('Timeout in par call: race', async () => {
        // arrange
        await peer.start();

        // act
        const promise = new Promise((resolve, reject) => {
            const script = `
                (seq
                    (call %init_peer_id% ("op" "identity") ["slow_result"] arg) 
                    (seq
                        (par
                            (call %init_peer_id% ("peer" "timeout") [1000 arg] $result)
                            (call %init_peer_id% ("op" "identity") ["fast_result"] $result)
                        )
                        (call %init_peer_id% ("return" "return") [$result.$[0]]) 
                    )
                )
            `;
            const particle = Particle.createNew(script);
            registerHandlersHelper(peer, particle, {
                return: {
                    return: (args) => {
                        resolve(args[0]);
                    },
                },
            });

            peer.internals.initiateParticle(particle, handleTimeout(reject));
        });

        // assert
        const res = await promise;
        expect(res).toBe('fast_result');

        await peer.stop();
    });

    it('Timeout in par call: wait', async () => {
        // arrange
        await peer.start();

        // act
        const promise = new Promise((resolve, reject) => {
            const script = `
                (seq
                    (call %init_peer_id% ("op" "identity") ["timeout_msg"] arg) 
                    (seq
                        (seq
                            (par
                                (call %init_peer_id% ("peer" "timeout") [1000 arg] $ok_or_err)
                                (call "invalid_peer" ("op" "identity") ["never"] $ok_or_err) 
                            )
                            (xor
                                (match $ok_or_err.$[0] "timeout_msg"
                                    (ap "failed_with_timeout" $result)
                                )
                                (ap "impossible happened" $result)
                            )
                        )
                        (call %init_peer_id% ("return" "return") [$result.$[0]]) 
                    )
                )
            `;
            const particle = Particle.createNew(script);
            registerHandlersHelper(peer, particle, {
                return: {
                    return: (args) => {
                        resolve(args[0]);
                    },
                },
            });

            peer.internals.initiateParticle(particle, handleTimeout(reject));
        });

        // assert
        const res = await promise;
        expect(res).toBe('failed_with_timeout');

        await peer.stop();
    });
});
