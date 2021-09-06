import { FluencePeer } from '../../..';
import { RequestFlowBuilder } from '../../internal/RequestFlowBuilder';

const peer = new FluencePeer();

describe('Avm spec', () => {
    afterEach(async () => {
        if (peer) {
            await peer.uninit();
        }
    });

    it('Par execution should work', async () => {
        // arrange
        await peer.init();

        let request;
        const promise = new Promise<string[]>((resolve) => {
            let res = [];
            request = new RequestFlowBuilder()
                .withRawScript(
                    `
                (seq
                    (par
                        (call %init_peer_id% ("print" "print") ["1"])
                        (null)
                    )
                    (call %init_peer_id% ("print" "print") ["2"])
                )
            `,
                )
                .configHandler((h) => {
                    h.onEvent('print', 'print', async (args) => {
                        res.push(args[0]);
                        if (res.length == 2) {
                            resolve(res);
                        }
                    });
                })
                .build();
        });

        // act
        await peer.internals.initiateFlow(request);
        const res = await promise;

        // assert
        expect(res).toStrictEqual(['1', '2']);
    });
});
