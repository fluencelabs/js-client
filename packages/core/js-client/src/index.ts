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

import { fetchResource } from "@fluencelabs/js-client-isomorphic/fetcher";
import { getWorker } from "@fluencelabs/js-client-isomorphic/worker-resolver";
import { ZodError } from "zod";

import { ClientPeer, makeClientPeerConfig } from "./clientPeer/ClientPeer.js";
import {
  ClientConfig,
  configSchema,
  ConnectionState,
  RelayOptions,
  relaySchema,
} from "./clientPeer/types.js";
import { callAquaFunction } from "./compilerSupport/callFunction.js";
import { registerService } from "./compilerSupport/registerService.js";
import { MarineBackgroundRunner } from "./marine/worker/index.js";

const DEFAULT_CDN_URL = "https://unpkg.com";

const createClient = async (
  relay: RelayOptions,
  config: ClientConfig = {},
): Promise<ClientPeer> => {
  try {
    relay = relaySchema.parse(relay);
    config = configSchema.parse(config);
  } catch (e) {
    if (e instanceof ZodError) {
      throw new Error(JSON.stringify(e.format()));
    }
  }

  const CDNUrl = config.CDNUrl ?? DEFAULT_CDN_URL;

  const fetchMarineJsWasm = async () => {
    const resource = await fetchResource(
      "@fluencelabs/marine-js",
      "/dist/marine-js.wasm",
      CDNUrl,
    );

    return resource.arrayBuffer();
  };

  const fetchAvmWasm = async () => {
    const resource = await fetchResource(
      "@fluencelabs/avm",
      "/dist/avm.wasm",
      CDNUrl,
    );

    return resource.arrayBuffer();
  };

  const marineJsWasm = await fetchMarineJsWasm();
  const avmWasm = await fetchAvmWasm();

  const marine = new MarineBackgroundRunner(
    {
      async getValue() {
        return getWorker("@fluencelabs/marine-worker", CDNUrl);
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
      start(): Promise<void> {
        return Promise.resolve(undefined);
      },
      stop(): Promise<void> {
        return Promise.resolve(undefined);
      },
    },
    {
      getValue() {
        return avmWasm;
      },
      start(): Promise<void> {
        return Promise.resolve(undefined);
      },
      stop(): Promise<void> {
        return Promise.resolve(undefined);
      },
    },
  );

  const { keyPair, peerConfig, relayConfig } = await makeClientPeerConfig(
    relay,
    config,
  );

  const client = new ClientPeer(peerConfig, relayConfig, keyPair, marine);

  // TODO: Support node specific utils
  // if (isNode) {
  //   doRegisterNodeUtils(client);
  // }

  await client.connect();
  return client;
};

/**
 * Public interface to Fluence Network
 */
interface FluencePublicApi {
  defaultClient: ClientPeer | undefined;
  connect: (relay: RelayOptions, config?: ClientConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  onConnectionStateChange: (
    handler: (state: ConnectionState) => void,
  ) => ConnectionState;
  getClient: () => ClientPeer;
}

export const Fluence: FluencePublicApi = {
  defaultClient: undefined,
  /**
   * Connect to the Fluence network
   * @param relay - relay node to connect to
   * @param config - client configuration
   */
  connect: async function (relay, config) {
    this.defaultClient = await createClient(relay, config);
  },

  /**
   * Disconnect from the Fluence network
   */
  disconnect: async function (): Promise<void> {
    await this.defaultClient?.disconnect();
    this.defaultClient = undefined;
  },

  /**
   * Handle connection state changes. Immediately returns the current connection state
   */
  onConnectionStateChange(handler) {
    return (
      this.defaultClient?.onConnectionStateChange(handler) ?? "disconnected"
    );
  },

  /**
   * Low level API. Get the underlying client instance which holds the connection to the network
   * @returns IFluenceClient instance
   */
  getClient: function () {
    if (this.defaultClient == null) {
      throw new Error(
        "Fluence client is not initialized. Call Fluence.connect() first",
      );
    }

    return this.defaultClient;
  },
};

export type {
  ClientConfig,
  IFluenceClient,
  ConnectionState,
  RelayOptions,
  KeyPairOptions,
} from "./clientPeer/types.js";

export type { ParticleContext } from "./jsServiceHost/interfaces.js";

export { v5_callFunction, v5_registerService } from "./api.js";

export { createClient, callAquaFunction, registerService };

export { ClientPeer } from "./clientPeer/ClientPeer.js";

// Deprecated exports. Later they will be exposed only under js-client/keypair path
export {
  KeyPair,
  fromBase64Sk,
  fromBase58Sk,
  fromOpts,
} from "./keypair/index.js";

export { FluencePeer } from "./jsPeer/FluencePeer.js";

export type { JSONValue, NonArrowSimpleType } from "@fluencelabs/interfaces";

export * from "./network.js";
