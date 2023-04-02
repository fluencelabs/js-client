import { PeerIdB58 } from '@fluencelabs/interfaces';
import { MarineBasedAvmRunner } from '../jsPeer/avm.js';
import { FluencePeer, PeerConfig } from '../jsPeer/FluencePeer.js';
import { KeyPair } from '../keypair/index.js';
import { WasmLoaderFromNpm } from '../marine/deps-loader/node.js';
import { WorkerLoader } from '../marine/worker-script/workerLoader.js';
import { MarineBackgroundRunner } from '../marine/worker/index.js';
import { EphemeralNetwork } from './network.js';
import { JsServiceHost } from '../jsServiceHost/JsServiceHost.js';

export class EphemeralNetworkClient extends FluencePeer {
    constructor(config: PeerConfig, keyPair: KeyPair, network: EphemeralNetwork, relay: PeerIdB58) {
        const workerLoader = new WorkerLoader();
        const controlModuleLoader = new WasmLoaderFromNpm('@fluencelabs/marine-js', 'marine-js.wasm');
        const avmModuleLoader = new WasmLoaderFromNpm('@fluencelabs/avm', 'avm.wasm');
        const marine = new MarineBackgroundRunner(workerLoader, controlModuleLoader);
        const avm = new MarineBasedAvmRunner(marine, avmModuleLoader);
        const conn = network.getRelayConnection(keyPair.getPeerId(), relay);
        super(config, keyPair, marine, new JsServiceHost(), avm, conn);
    }
}
