/**
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

import { PeerIdB58 } from "@fluencelabs/interfaces";
import { fetchResource } from "@fluencelabs/js-client-isomorphic/fetcher";
import { getWorker } from "@fluencelabs/js-client-isomorphic/worker-resolver";

import { FluencePeer, PeerConfig } from "../jsPeer/FluencePeer.js";
import { JsServiceHost } from "../jsServiceHost/JsServiceHost.js";
import { KeyPair } from "../keypair/index.js";
import { MarineBackgroundRunner } from "../marine/worker/index.js";

import { EphemeralNetwork } from "./network.js";

/**
 * Ephemeral network client is a FluencePeer that connects to a relay peer in an ephemeral network.
 */
export class EphemeralNetworkClient extends FluencePeer {
  constructor(
    config: PeerConfig,
    keyPair: KeyPair,
    network: EphemeralNetwork,
    relay: PeerIdB58,
  ) {
    const conn = network.getRelayConnection(keyPair.getPeerId(), relay);

    let marineJsWasm: ArrayBuffer;
    let avmWasm: ArrayBuffer;

    const marine = new MarineBackgroundRunner(
      {
        async getValue() {
          // TODO: load worker in parallel with avm and marine, test that it works
          return getWorker("@fluencelabs/marine-worker", "/");
        },
        start() {
          return Promise.resolve(undefined);
        },
        stop() {
          return Promise.resolve(undefined);
        },
      },
      {
        getValue() {
          return marineJsWasm;
        },
        async start(): Promise<void> {
          marineJsWasm = await fetchResource(
            "@fluencelabs/marine-js",
            "/dist/marine-js.wasm",
            "/",
          ).then((res) => {
            return res.arrayBuffer();
          });
        },
        stop(): Promise<void> {
          return Promise.resolve(undefined);
        },
      },
      {
        getValue() {
          return avmWasm;
        },
        async start(): Promise<void> {
          avmWasm = await fetchResource(
            "@fluencelabs/avm",
            "/dist/avm.wasm",
            "/",
          ).then((res) => {
            return res.arrayBuffer();
          });
        },
        stop(): Promise<void> {
          return Promise.resolve(undefined);
        },
      },
    );

    super(config, keyPair, marine, new JsServiceHost(), conn);
  }
}
