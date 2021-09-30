import { Fluence, FluencePeer } from '../../index';
import { CallServiceHandler } from '../../internal/CallServiceHandler';
import { Particle } from '../../internal/particle';

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
        const promise = new Promise<string[]>((resolve) => {
            const script = `
                (call %init_peer_id% ("print" "print") ["1"])
            `;
            const particle = Particle.createNew(script);
            const h = new CallServiceHandler();
            h.onEvent('print', 'print', async (args) => {
                const [res] = args;
                resolve(res);
            });
            particle.meta = {
                handler: h,
            };

            anotherPeer.internals.initiateFlow(particle);
        });

        // assert
        const res = await promise;
        expect(res).toBe('1');
    });

    it('Par call', async () => {
        // arrange
        await anotherPeer.start();

        // act
        const promise = new Promise<string[]>((resolve) => {
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
            const h = new CallServiceHandler();
            h.onEvent('print', 'print', async (args) => {
                res.push(args[0]);
                if (res.length == 2) {
                    resolve(res);
                }
            });
            particle.meta = {
                handler: h,
            };

            anotherPeer.internals.initiateFlow(particle);
        });

        // assert
        const res = await promise;
        expect(res).toStrictEqual(['1', '2']);
    });
});
