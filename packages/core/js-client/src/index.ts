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

import module from "module";
import path from "path";
import process from "process";
import url from "url";

import type {
  ClientConfig,
  ConnectionState,
  RelayOptions,
} from "@fluencelabs/interfaces";

// "threads" package has broken type definitions in package.json. This is the workaround.
import { BlobWorker, Worker } from "threads/master";

import { ClientPeer, makeClientPeerConfig } from "./clientPeer/ClientPeer.js";
import { callAquaFunction } from "./compilerSupport/callFunction.js";
import { registerService } from "./compilerSupport/registerService.js";
import { fetchResource } from "./fetchers/index.js";
import { MarineBackgroundRunner } from "./marine/worker/index.js";
import { doRegisterNodeUtils } from "./services/NodeUtils.js";

const isNode =
  typeof process !== "undefined" && process.release.name === "node";

const fetchWorkerCode = async () => {
  const resource = await fetchResource(
    "@fluencelabs/marine-worker",
    "/dist/browser/marine-worker.umd.cjs",
  );

  return resource.text();
};

const fetchMarineJsWasm = async () => {
  const resource = await fetchResource(
    "@fluencelabs/marine-js",
    "/dist/marine-js.wasm",
  );

  return resource.arrayBuffer();
};

const fetchAvmWasm = async () => {
  const resource = await fetchResource("@fluencelabs/avm", "/dist/avm.wasm");
  return resource.arrayBuffer();
};

const createClient = async (
  relay: RelayOptions,
  config: ClientConfig,
): Promise<ClientPeer> => {
  const marineJsWasm = await fetchMarineJsWasm();
  const avmWasm = await fetchAvmWasm();

  const marine = new MarineBackgroundRunner(
    {
      async getValue() {
        if (isNode) {
          const require = module.createRequire(import.meta.url);

          const pathToThisFile = path.dirname(
            url.fileURLToPath(import.meta.url),
          );

          const pathToWorker = require.resolve("@fluencelabs/marine-worker");

          const relativePathToWorker = path.relative(
            pathToThisFile,
            pathToWorker,
          );

          return new Worker(relativePathToWorker);
        } else {
          const workerCode = await fetchWorkerCode();
          return BlobWorker.fromText(workerCode);
        }
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

  if (isNode) {
    doRegisterNodeUtils(client);
  }

  await client.connect();
  return client;
};

/**
 * Public interface to Fluence Network
 */
interface FluencePublicApi {
  defaultClient: ClientPeer | undefined;
  connect: (relay: RelayOptions, config: ClientConfig) => Promise<void>;
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
  IFluenceClient,
  ClientConfig,
  CallParams,
} from "@fluencelabs/interfaces";

export type {
  ArrayType,
  ArrowType,
  ArrowWithCallbacks,
  ArrowWithoutCallbacks,
  BottomType,
  FunctionCallConstants,
  FunctionCallDef,
  LabeledProductType,
  NilType,
  NonArrowType,
  OptionType,
  ProductType,
  ScalarNames,
  ScalarType,
  ServiceDef,
  StructType,
  TopType,
  UnlabeledProductType,
  CallAquaFunctionType,
  CallAquaFunctionArgs,
  PassedArgs,
  FnConfig,
  RegisterServiceType,
  RegisterServiceArgs,
} from "@fluencelabs/interfaces";

export { v5_callFunction, v5_registerService } from "./api.js";

// @ts-expect-error Writing to global object like this prohibited by ts
globalThis.new_fluence = Fluence;

// @ts-expect-error Writing to global object like this prohibited by ts
globalThis.fluence = {
  clientFactory: createClient,
  callAquaFunction,
  registerService,
};

export { createClient, callAquaFunction, registerService };
export {
  KeyPair,
  fromBase64Sk,
  fromBase58Sk,
  fromOpts,
} from "./keypair/index.js";
