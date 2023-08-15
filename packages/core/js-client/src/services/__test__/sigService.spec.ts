import { it, describe, expect, beforeAll } from 'vitest';

import * as path from 'path';
import * as url from 'url';
import { KeyPair } from '../../keypair/index.js';
import { allowServiceFn } from '../securityGuard.js';
import { Sig } from '../Sig.js';
import { registerService } from '../../compilerSupport/registerService.js';
import { compileAqua, withPeer } from '../../util/testUtils.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

let aqua: any;
let sigDef: any;
let dataProviderDef: any;

describe('Sig service test suite', () => {
    beforeAll(async () => {
        const pathToAquaFiles = path.join(__dirname, '../../../aqua_test/sigService.aqua');
        const { services, functions } = await compileAqua(pathToAquaFiles);

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
            expect(result.success).toBe(false);
        });
    });

    it('Default sig service should be resolvable by peer id', async () => {
        await withPeer(async (peer) => {
            const sig = peer.internals.getServices().sig;

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
            const callAsPeerIdRes = await aqua.callSig(peer, { sigId: peer.keyPair.getPeerId() });

            expect(callAsSigRes.success).toBe(false);
            expect(callAsPeerIdRes.success).toBe(false);

            sig.securityGuard = () => true;

            const callAsSigResAfterGuardChange = await aqua.callSig(peer, { sigId: 'sig' });
            const callAsPeerIdResAfterGuardChange = await aqua.callSig(peer, {
                sigId: peer.keyPair.getPeerId(),
            });

            expect(callAsSigResAfterGuardChange.success).toBe(true);
            expect(callAsPeerIdResAfterGuardChange.success).toBe(true);

            const isValid = await sig.verify(callAsSigResAfterGuardChange.signature as number[], data);

            expect(isValid).toBe(true);
        });
    });
});
