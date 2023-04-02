import type { RelayOptions, ClientConfig, IFluenceClient } from '@fluencelabs/interfaces';
import { ClientPeer, makeClientPeerConfig } from '@fluencelabs/js-peer/dist/clientPeer/ClientPeer.js';
import { callAquaFunction } from '@fluencelabs/js-peer/dist/compilerSupport/callFunction.js';
import { registerService } from '@fluencelabs/js-peer/dist/compilerSupport/registerService.js';
import { MarineBasedAvmRunner } from '@fluencelabs/js-peer/dist/js-peer/avm.js';
import { MarineBackgroundRunner } from '@fluencelabs/js-peer/dist/marine/worker';
import { InlinedWorkerLoader, InlinedWasmLoader } from '@fluencelabs/js-peer/dist/marine/deps-loader/common.js';

const createClient = async (relay: RelayOptions, config: ClientConfig): Promise<IFluenceClient> => {
    const workerLoader = new InlinedWorkerLoader('___worker___');
    const controlModuleLoader = new InlinedWasmLoader('___marine___');
    const avmModuleLoader = new InlinedWasmLoader('___avm___');

    const marine = new MarineBackgroundRunner(workerLoader, controlModuleLoader);
    const avm = new MarineBasedAvmRunner(marine, avmModuleLoader);
    const { keyPair, peerConfig, relayConfig } = await makeClientPeerConfig(relay, config);
    const client: IFluenceClient = new ClientPeer(peerConfig, relayConfig, keyPair, marine, avm);
    await client.connect();
    return client;
};

const publicFluenceInterface = {
    clientFactory: createClient,
    callAquaFunction,
    registerService,
};

// @ts-ignore
globalThis.fluence = publicFluenceInterface;
