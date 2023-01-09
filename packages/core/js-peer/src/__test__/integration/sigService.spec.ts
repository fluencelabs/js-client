import path from 'path';
import { KeyPair } from '@fluencelabs/keypair';
import { allowServiceFn } from '../../builtins/securityGuard';
import { Sig } from '../../builtins/Sig';
import { compileAqua, withPeer } from '../util';
import { registerServiceImpl } from '../../compilerSupport/registerService';

let aqua: any;
let sigDef: any;
let dataProviderDef: any;

describe('Sig service test suite', () => {
    beforeAll(async () => {
        const { services, functions } = await compileAqua(path.join(__dirname, './sigService.aqua'));
        aqua = functions;
        sigDef = services.Sig;
        dataProviderDef = services.DataProvider;
    });

    it('Use custom sig service, success path', async () => {
        await withPeer(async (peer) => {
            const customKeyPair = await KeyPair.randomEd25519();
            const customSig = new Sig(customKeyPair);
            const data = [1, 2, 3, 4, 5];

            registerServiceImpl(peer, sigDef, 'CustomSig', customSig);

            registerServiceImpl(peer, dataProviderDef, 'data', {
                provide_data: () => {
                    return data;
                },
            });

            customSig.securityGuard = allowServiceFn('data', 'provide_data');

            const result = await aqua.callSig(peer, { sigId: 'CustomSig' });

            expect(result.success).toBe(true);
            const isSigCorrect = await customSig.verify(result.signature as number[], data);
            expect(isSigCorrect).toBe(true);
        });
    });

    it('Use custom sig service, fail path', async () => {
        await withPeer(async (peer) => {
            const customKeyPair = await KeyPair.randomEd25519();
            const customSig = new Sig(customKeyPair);
            const data = [1, 2, 3, 4, 5];

            registerServiceImpl(peer, sigDef, 'CustomSig', customSig);

            registerServiceImpl(peer, dataProviderDef, 'data', {
                provide_data: () => {
                    return data;
                },
            });

            customSig.securityGuard = allowServiceFn('wrong', 'wrong');

            const result = await aqua.callSig(peer, { sigId: 'CustomSig' });
        });
    });

    it('Default sig service should be resolvable by peer id', async () => {
        await withPeer(async (peer) => {
            const sig = peer.getServices().sig;

            const data = [1, 2, 3, 4, 5];
            registerServiceImpl(peer, dataProviderDef, 'data', {
                provide_data: () => {
                    return data;
                },
            });

            const callAsSigRes = await aqua.callSig(peer, { sigId: 'sig' });
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
});
