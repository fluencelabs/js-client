import { FluencePeer } from '@fluencelabs/js-peer/dist/js-peer/FluencePeer';
import { MarineBasedAvmRunner } from '@fluencelabs/js-peer/dist/js-peer/avm';
import { MarineBackgroundRunner } from '@fluencelabs/js-peer/dist/marine/worker';
import { checkConnection, marineLogFunction } from '@fluencelabs/js-peer/dist/js-peer/utils';
import { InlinedWorkerLoader, InlineWasmLoader } from '@fluencelabs/js-peer/dist/marine/deps-loader/common';

export const makeDefaultPeer = () => {
    const workerLoader = new InlinedWorkerLoader('___worker___');
    const controlModuleLoader = new InlineWasmLoader('___marine___');
    const avmModuleLoader = new InlineWasmLoader('___avm___');

    const marine = new MarineBackgroundRunner(workerLoader, controlModuleLoader, marineLogFunction);
    const avm = new MarineBasedAvmRunner(marine, avmModuleLoader, undefined);
    return new FluencePeer(marine, avm);
};

// @ts-ignore
globalThis.defaultPeer = makeDefaultPeer();

// TODO! remove
// @ts-ignore
window.demo = async () => {
    // @ts-ignore
    const peer: FluencePeer = globalThis.defaultPeer;

    await peer.start({
        connectTo: {
            multiaddr: '/ip4/127.0.0.1/tcp/4310/ws/p2p/12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
            peerId: '12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
        },
    });

    const res = await checkConnection(peer);
    console.log('Check connection res', res);
};
