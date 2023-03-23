import { it, describe, expect, beforeAll } from 'vitest';

import * as path from 'path';
import * as url from 'url';
import { KeyPair } from '../../../keypair/index.js';
import { allowServiceFn } from '../../builtins/securityGuard.js';
import { Sig } from '../../builtins/Sig.js';
import { compileAqua, withPeer } from '../util.js';
import { registerService } from '../../../compilerSupport/registerService.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

let aqua: any;
let sigDef: any;
let dataProviderDef: any;

describe('Sig service test suite', () => {
    beforeAll(async () => {
        const { services, functions } = await compileAqua(path.join(__dirname, '../data/sigService.aqua'));
        aqua = functions;
        sigDef = services.Sig;
        dataProviderDef = services.DataProvider;
    });

    it('Use custom sig service, success path', async () => {
        await withPeer(async (peer) => {
            const customKeyPair = await KeyPair.randomEd25519();
            const customSig = new Sig(customKeyPair);
            const data = [1, 2, 3, 4, 5];

            registerService({ peer, def: sigDef, serviceId: 'CustomSig', service: customSig });

            registerService({
                peer,
                def: dataProviderDef,
                serviceId: 'data',
                service: {
                    provide_data: () => {
                        return data;
                    },
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

            registerService({ peer, def: sigDef, serviceId: 'CustomSig', service: customSig });

            registerService({
                peer,
                def: dataProviderDef,
                serviceId: 'data',
                service: {
                    provide_data: () => {
                        return data;
                    },
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
            registerService({
                peer: peer,
                def: dataProviderDef,
                serviceId: 'data',
                service: {
                    provide_data: () => {
                        return data;
                    },
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
