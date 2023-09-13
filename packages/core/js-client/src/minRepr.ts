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

import { createLibp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets';
import { all } from '@libp2p/websockets/filters';
import { yamux } from '@chainsafe/libp2p-yamux';
import { noise } from '@chainsafe/libp2p-noise';
import { KeyPair } from './keypair/index.js';
import { generateKeyPair } from '@libp2p/crypto/keys';
import { createFromPrivKey } from '@libp2p/peer-id-factory';
import { multiaddr } from '@multiformats/multiaddr';
import { identifyService } from 'libp2p/identify';
import { pingService } from 'libp2p/ping';

const key = await generateKeyPair('Ed25519');
const lib2p2Pid = await createFromPrivKey(key);

const connConfig = {
    peerId: new KeyPair(key, lib2p2Pid).getLibp2pPeerId(),
    relayAddress: multiaddr('/ip4/127.0.0.1/tcp/9991/ws/p2p/12D3KooWBM3SdXWqGaawQDGQ6JprtwswEg3FWGvGhmgmMez1vRbR'),
    maxInboundStreams: 1024,
    maxOutboundStreams: 1024,
};

const lib2p2Peer = await createLibp2p({
    peerId: connConfig.peerId,
    transports: [
        webSockets({
            filter: (data) => {
                data = data.filter(d => d.toString().includes('127.0.0.1'));
                return all(data);
            },
        }),
    ],
    streamMuxers: [yamux()],
    connectionEncryption: [noise()],
    connectionGater: {
        // By default, this function forbids connections to private peers. For example multiaddr with ip 127.0.0.1 isn't allowed
        denyDialMultiaddr: () => Promise.resolve(false)
    },
    services: {
        identify: identifyService(),
        ping: pingService()
    }
});

const connection = await lib2p2Peer.dial(connConfig.relayAddress);
const stream = await connection.newStream('/fluence/particle/2.0.0');
console.log('stream opened');