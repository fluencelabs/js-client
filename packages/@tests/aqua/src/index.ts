/**
 * Copyright 2024 Fluence DAO
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

import { Fluence, type ClientConfig } from "@fluencelabs/js-client";

import { test as particleTest } from "./_aqua/finalize_particle.js";
import {
  registerHelloWorld,
  helloTest,
  marineTest,
} from "./_aqua/smoke_test.js";
import { wasm } from "./wasmb64.js";

const relay = {
  multiaddr:
    "/ip4/127.0.0.1/tcp/999/ws/p2p/12D3KooWBbMuqJJZT7FTFN4fWg3k3ipUKx6KEy7pDy8mdorK5g5o",
  peerId: "12D3KooWBbMuqJJZT7FTFN4fWg3k3ipUKx6KEy7pDy8mdorK5g5o",
};

function generateRandomUint8Array() {
  const uint8Array = new Uint8Array(32);

  for (let i = 0; i < uint8Array.length; i++) {
    uint8Array[i] = Math.floor(Math.random() * 256);
  }

  return uint8Array;
}

const optsWithRandomKeyPair = (): ClientConfig => {
  return {
    keyPair: {
      type: "Ed25519",
      source: generateRandomUint8Array(),
    },
  } as const;
};

export type TestResult =
  | { type: "success"; data: string }
  | { type: "failure"; error: string };

export const runTest = async (): Promise<TestResult> => {
  try {
    console.log("connecting to Fluence Network...");
    console.log("multiaddr: ", relay.multiaddr);

    await Fluence.connect(relay, {
      ...optsWithRandomKeyPair(),
      CDNUrl: "http://localhost:3001",
    });

    console.log("connected");

    const relayPeerId = Fluence.getClient().getRelayPeerId();
    console.log("relay:", relayPeerId);

    registerHelloWorld({
      hello(str) {
        return "Hello, " + str + "!";
      },
    });

    const client = Fluence.getClient();

    console.log("my peer id: ", client.getPeerId());

    console.log("running hello test...");
    const hello = await helloTest();
    console.log("hello test finished, result: ", hello);

    console.log("running marine test...");
    const marine = await marineTest(wasm);
    console.log("marine test finished, result: ", marine);

    console.log("running particle test...");

    await particleTest();

    const returnVal = {
      hello,
      marine,
    };

    return { type: "success", data: JSON.stringify(returnVal) };
  } finally {
    console.log("disconnecting from Fluence Network...");
    await Fluence.disconnect();
    console.log("disconnected");
  }
};

export const runMain = () => {
  runTest()
    .then(() => {
      console.log("done!");
    })
    .catch((err) => {
      console.error("error: ", err);
    });
};
