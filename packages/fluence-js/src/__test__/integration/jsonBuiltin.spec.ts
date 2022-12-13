import { Particle } from '../../internal/Particle';
import { doNothing } from '../../internal/utils';
import { FluencePeer } from '../../index';
import { makeDefaultPeer } from '../../internal/FluencePeer';

let peer: FluencePeer;

describe('Sig service test suite', () => {
    afterEach(async () => {
        if (peer) {
            await peer.stop();
        }
    });

    beforeEach(async () => {
        peer = makeDefaultPeer();
        await peer.start();
    });

    it('JSON builtin spec', async () => {
        const script = `
        (seq
            (seq
                (seq
                    ;; create
                    (seq
                        (call %init_peer_id% ("json" "obj") ["name" "nested_first" "num" 1] nested_first)
                        (call %init_peer_id% ("json" "obj") ["name" "nested_second" "num" 2] nested_second)
                    )
                    (call %init_peer_id% ("json" "obj") ["name" "outer_first" "num" 0 "nested" nested_first] outer_first)
                )
                (seq
                    ;; modify
                    (seq
                        (call %init_peer_id% ("json" "put") [outer_first "nested" nested_second] outer_tmp_second)
                        (call %init_peer_id% ("json" "puts") [outer_tmp_second "name" "outer_second" "num" 3] outer_second)
                    )
                    ;; stringify and parse
                    (seq
                        (call %init_peer_id% ("json" "stringify") [outer_first] outer_first_string)
                        (call %init_peer_id% ("json" "parse") [outer_first_string] outer_first_parsed)
                    )
                )
            )
            (call %init_peer_id% ("res" "res") [nested_first nested_second outer_first outer_second outer_first_string outer_first_parsed])
        )
    `;
        const promise = new Promise<any>((resolve) => {
            peer.internals.regHandler.common('res', 'res', (req) => {
                resolve(req.args);
                return {
                    result: {},
                    retCode: 0,
                };
            });
        });
        const p = peer.internals.createNewParticle(script) as Particle;
        await peer.internals.initiateParticle(p, doNothing);

        const [nestedFirst, nestedSecond, outerFirst, outerSecond, outerFirstString, outerFirstParsed] = await promise;

        const nfExpected = { name: 'nested_first', num: 1 };
        const nsExpected = { name: 'nested_second', num: 2 };

        const ofExpected = { name: 'outer_first', nested: nfExpected, num: 0 };
        const ofString = JSON.stringify(ofExpected);
        const osExpected = { name: 'outer_second', num: 3, nested: nsExpected };

        expect(nestedFirst).toMatchObject(nfExpected);
        expect(nestedSecond).toMatchObject(nsExpected);
        expect(outerFirst).toMatchObject(ofExpected);
        expect(outerSecond).toMatchObject(osExpected);
        expect(outerFirstParsed).toMatchObject(ofExpected);
        expect(outerFirstString).toBe(ofString);
    });
});
