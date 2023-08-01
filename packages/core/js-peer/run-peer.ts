/*
 * Copyright 2023 Fluence Labs Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { KeyPair } from './src/keypair/index.js';
import { RELAY } from './src/clientPeer/__test__/connection.js';
import { ClientPeer } from './src/clientPeer/ClientPeer.js';
import { WorkerLoader } from './src/marine/worker-script/workerLoader.js';
import { WasmLoaderFromNpm } from './src/marine/deps-loader/node.js';
import { MarineBackgroundRunner } from './src/marine/worker/index.js';
import { MarineBasedAvmRunner } from './src/jsPeer/avm.js';
import { multiaddr } from '@multiformats/multiaddr';

// const key = '+cmeYlZKj+MfSa9dpHV+BmLPm6wq4inGlsPlQ1GvtPk=';
// const keyBytes = toUint8Array(key);
//
// const privKey = await generateKeyPairFromSeed('Ed25519', keyBytes, 256);
// const peer = new ClientPeer({}, new KeyPair(privKey, "12D3KooWBM3SdXWqGaawQDGQ6JprtwswEg3FWGvGhmgmMez1vRbR"));
// await peer.start();

const workerLoader = new WorkerLoader();
const controlModuleLoader = new WasmLoaderFromNpm('@fluencelabs/marine-js', 'marine-js.wasm');
const avmModuleLoader = new WasmLoaderFromNpm('@fluencelabs/avm', 'avm.wasm');
const marine = new MarineBackgroundRunner(workerLoader, controlModuleLoader);
const avm = new MarineBasedAvmRunner(marine, avmModuleLoader);

const r = await KeyPair.randomEd25519();
const clientPeer = new ClientPeer({
    debug: {
        printParticleId: false,
    },
    defaultTtlMs: 7000,
}, {
    peerId: r.getLibp2pPeerId(),
    relayAddress: multiaddr(RELAY),
    dialTimeoutMs: undefined,
    maxInboundStreams: 1024,
    maxOutboundStreams: 1024,
}, r, marine, avm);
await clientPeer.connect();
