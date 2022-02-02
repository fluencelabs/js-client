import { Fluence, FluencePeer, KeyPair, setLogLevel } from '../../index';
import { allowServiceFn, Sig } from '../../services';
import { registerSig, registerDataProvider, callSig } from '../_aqua/sig-tests';

let peer: FluencePeer;

describe('Sig service test suite', () => {
    afterEach(async () => {
        if (peer) {
            await peer.stop();
        }
    });

    beforeEach(async () => {
        peer = new FluencePeer();
        await peer.start();
    });

    it('Use custom sig service', async () => {
        const peer = new FluencePeer();
        await peer.start();

        const customKeyPair = await KeyPair.randomEd25519();
        const customSig = new Sig(customKeyPair);
        const data = [1, 2, 3, 4, 5];

        registerSig(peer, 'CustomSig', customSig);

        registerDataProvider(peer, {
            provide_data: () => {
                return data;
            },
        });

        customSig.securityGuard = allowServiceFn('data', 'provide_data');

        let result;
        await callSig(
            peer,
            'CustomSig',
            (res) => {
                result = res;
            },
            (fail) => {
                result = fail;
            },
        );

        const isSigCorrect = await customSig.verify(result, data);
        expect(isSigCorrect).toBe(true);
    });

    it('Use custom sig service 1', async () => {
        const peer = new FluencePeer();
        await peer.start();

        const customKeyPair = await KeyPair.randomEd25519();
        const customSig = new Sig(customKeyPair);
        const data = [1, 2, 3, 4, 5];

        registerSig(peer, 'CustomSig', customSig);

        registerDataProvider(peer, {
            provide_data: () => {
                return data;
            },
        });

        customSig.securityGuard = allowServiceFn('wrong', 'wrong');

        let result;
        await callSig(
            peer,
            'CustomSig',
            (res) => {
                result = res;
            },
            (fail) => {
                result = fail;
            },
        );

        expect(result).toBe('');
    });
});
