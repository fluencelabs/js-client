import { Multiaddr } from 'multiaddr';
import { nodes } from '../connection';
import { Fluence, FluencePeer, KeyPair, setLogLevel } from '../../index';
import { checkConnection, doNothing, handleTimeout } from '../../internal/utils';
import { Sig, registerSig } from '../../services';
import { registerHandlersHelper } from '../util';

let peer;

describe('Typescript usage suite', () => {
    afterEach(async () => {
        if (peer) {
            await peer.stop();
        }
    });

    beforeEach(() => {
        peer = new FluencePeer();
    });

    it('Register custom sig service', async () => {
        const customKeyPair = await KeyPair.randomEd25519();
        const customSig = new Sig(customKeyPair);

        customSig.allowedServices.push('some_other_service.some_other_fn');

        registerSig('CustomSig', customSig);

        // or register for specific peer

        const customPeer = new FluencePeer();
        registerSig(customPeer, 'CustomSig', customSig);
    });

    it('Add another function to Sig tetraplets', async () => {
        const sig = Fluence.getPeer().getServices().sig;
        sig.allowedServices.push('some_other_service.some_other_fn');
    });

    it('Add another function to Sig tetraplets (in non-default peer', async () => {
        const customPeer = new FluencePeer();
        await customPeer.start();

        const sig = customPeer.getServices().sig;
        
        sig.allowedServices.push('some_other_service.some_other_fn');
    });
});
