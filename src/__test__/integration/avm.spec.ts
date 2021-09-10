import Fluence, { FluencePeer } from '../../index';
import { RequestFlowBuilder } from '../../internal/RequestFlowBuilder';

const anotherPeer = new FluencePeer();

describe('Avm spec', () => {
    afterEach(async () => {
        if (anotherPeer) {
            await anotherPeer.stop();
        }
    });

    it('Par execution should work', async () => {
        // arrange
        await Fluence.start();

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
        await Fluence.getPeer().internals.initiateFlow(request);
        const res = await promise;

        // assert
        expect(res).toStrictEqual(['1', '2']);
    });
});
