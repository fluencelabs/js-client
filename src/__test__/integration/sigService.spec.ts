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

    it('Use custom sig service, success path', async () => {
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

        const result = await callSig(peer, 'CustomSig');

        expect(result.success).toBe(true);
        const isSigCorrect = await customSig.verify(result.signature as number[], data);
        expect(isSigCorrect).toBe(true);
    });

    it('Use custom sig service, fail path', async () => {
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

        const result = await callSig(peer, 'CustomSig');
    });

    it('Default sig service should be resolvable by peer id', async () => {
        const sig = peer.getServices().sig;

        const data = [1, 2, 3, 4, 5];
        registerDataProvider(peer, {
            provide_data: () => {
                return data;
            },
        });

        const callAsSigRes = await callSig(peer, 'sig');
        const callAsPeerIdRes = await callSig(peer, peer.getStatus().peerId as string);

        expect(callAsSigRes.success).toBe(false);
        expect(callAsPeerIdRes.success).toBe(false);

        sig.securityGuard = () => true;

        const callAsSigResAfterGuardChange = await callSig(peer, 'sig');
        const callAsPeerIdResAfterGuardChange = await callSig(peer, peer.getStatus().peerId as string);

        expect(callAsSigResAfterGuardChange.success).toBe(true);
        expect(callAsPeerIdResAfterGuardChange.success).toBe(true);

        const isValid = await sig.verify(callAsSigResAfterGuardChange.signature as number[], data);

        expect(isValid).toBe(true);
    });
});
