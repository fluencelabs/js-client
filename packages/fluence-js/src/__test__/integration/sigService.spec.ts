import path from 'path';
import { allowServiceFn } from '../../internal/builtins/securityGuard';
import { Sig } from '../../services';
import { makeDefaultPeer, FluencePeer } from '../../internal/FluencePeer';
import { KeyPair } from '@fluencelabs/keypair';
import { compileAqua } from '../util';

let peer: FluencePeer;
let aqua: any;

describe('Sig service test suite', () => {
    beforeAll(async () => {
        aqua = await compileAqua(path.join(__dirname, './marine-js.aqua'));
    });

    afterEach(async () => {
        if (peer) {
            await peer.stop();
        }
    });

    beforeEach(async () => {
        peer = makeDefaultPeer();
        await peer.start();
    });

    it('Use custom sig service, success path', async () => {
        const customKeyPair = await KeyPair.randomEd25519();
        const customSig = new Sig(customKeyPair);
        const data = [1, 2, 3, 4, 5];

        registerSig(peer, 'CustomSig', customSig);

        registerDataProvider(peer, 'data', {
            provide_data: () => {
                return data;
            },
        });

        customSig.securityGuard = allowServiceFn('data', 'provide_data');

        const result = await aqua.callSig(peer, ['CustomSig']);

        expect(result.success).toBe(true);
        const isSigCorrect = await customSig.verify(result.signature as number[], data);
        expect(isSigCorrect).toBe(true);
    });

    it('Use custom sig service, fail path', async () => {
        const customKeyPair = await KeyPair.randomEd25519();
        const customSig = new Sig(customKeyPair);
        const data = [1, 2, 3, 4, 5];

        registerSig(peer, 'CustomSig', customSig);

        registerDataProvider(peer, 'data', {
            provide_data: () => {
                return data;
            },
        });

        customSig.securityGuard = allowServiceFn('wrong', 'wrong');

        const result = await aqua.callSig(peer, { sigId: 'CustomSig' });
    });

    it('Default sig service should be resolvable by peer id', async () => {
        const sig = peer.getServices().sig;

        const data = [1, 2, 3, 4, 5];
        registerDataProvider(peer, 'data', {
            provide_data: () => {
                return data;
            },
        });

        const callAsSigRes = await aqua.allSig(peer, { sigId: 'sig' });
        const callAsPeerIdRes = await aqua.callSig(peer, { sigId: peer.getStatus().peerId });

        expect(callAsSigRes.success).toBe(false);
        expect(callAsPeerIdRes.success).toBe(false);

        sig.securityGuard = () => true;

        const callAsSigResAfterGuardChange = await aqua.callSig(peer, { sigId: 'sig' });
        const callAsPeerIdResAfterGuardChange = await aqua.callSig(peer, {
            sigId: peer.getStatus().peerId,
        });

        expect(callAsSigResAfterGuardChange.success).toBe(true);
        expect(callAsPeerIdResAfterGuardChange.success).toBe(true);

        const isValid = await sig.verify(callAsSigResAfterGuardChange.signature as number[], data);

        expect(isValid).toBe(true);
    });
});
