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

export type Relay = { peerId: string; multiaddr: string };

export const stage: Relay[] = [
  {
    multiaddr:
      "/dns4/0-stage.fluence.dev/tcp/9000/wss/p2p/12D3KooWDcpWuyrMTDinqNgmXAuRdfd2mTdY9VoXZSAet2pDzh6r",
    peerId: "12D3KooWDcpWuyrMTDinqNgmXAuRdfd2mTdY9VoXZSAet2pDzh6r",
  },
  {
    multiaddr:
      "/dns4/1-stage.fluence.dev/tcp/9000/wss/p2p/12D3KooWHCJbJKGDfCgHSoCuK9q4STyRnVveqLoXAPBbXHTZx9Cv",
    peerId: "12D3KooWHCJbJKGDfCgHSoCuK9q4STyRnVveqLoXAPBbXHTZx9Cv",
  },
  {
    multiaddr:
      "/dns4/2-stage.fluence.dev/tcp/9000/wss/p2p/12D3KooWMigkP4jkVyufq5JnDJL6nXvyjeaDNpRfEZqQhsG3sYCU",
    peerId: "12D3KooWMigkP4jkVyufq5JnDJL6nXvyjeaDNpRfEZqQhsG3sYCU",
  },
  {
    multiaddr:
      "/dns4/3-stage.fluence.dev/tcp/9000/wss/p2p/12D3KooWMMGdfVEJ1rWe1nH1nehYDzNEHhg5ogdfiGk88AupCMnf",
    peerId: "12D3KooWMMGdfVEJ1rWe1nH1nehYDzNEHhg5ogdfiGk88AupCMnf",
  },
  {
    multiaddr:
      "/dns4/4-stage.fluence.dev/tcp/9000/wss/p2p/12D3KooWJ4bTHirdTFNZpCS72TAzwtdmavTBkkEXtzo6wHL25CtE",
    peerId: "12D3KooWJ4bTHirdTFNZpCS72TAzwtdmavTBkkEXtzo6wHL25CtE",
  },
  {
    multiaddr:
      "/dns4/5-stage.fluence.dev/tcp/9000/wss/p2p/12D3KooWAKNos2KogexTXhrkMZzFYpLHuWJ4PgoAhurSAv7o5CWA",
    peerId: "12D3KooWAKNos2KogexTXhrkMZzFYpLHuWJ4PgoAhurSAv7o5CWA",
  },
];

export const testNet: Relay[] = [
  {
    multiaddr:
      "/dns4/0-dar.fluence.dev/tcp/9000/wss/p2p/12D3KooWMhVpgfQxBLkQkJed8VFNvgN4iE6MD7xCybb1ZYWW2Gtz",
    peerId: "12D3KooWMhVpgfQxBLkQkJed8VFNvgN4iE6MD7xCybb1ZYWW2Gtz",
  },
  {
    multiaddr:
      "/dns4/1-dar.fluence.dev/tcp/9000/wss/p2p/12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9",
    peerId: "12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9",
  },
  {
    multiaddr:
      "/dns4/2-dar.fluence.dev/tcp/9000/wss/p2p/12D3KooWHk9BjDQBUqnavciRPhAYFvqKBe4ZiPPvde7vDaqgn5er",
    peerId: "12D3KooWHk9BjDQBUqnavciRPhAYFvqKBe4ZiPPvde7vDaqgn5er",
  },
  {
    multiaddr:
      "/dns4/3-dar.fluence.dev/tcp/9000/wss/p2p/12D3KooWBUJifCTgaxAUrcM9JysqCcS4CS8tiYH5hExbdWCAoNwb",
    peerId: "12D3KooWBUJifCTgaxAUrcM9JysqCcS4CS8tiYH5hExbdWCAoNwb",
  },
  {
    multiaddr:
      "/dns4/4-dar.fluence.dev/tcp/9000/wss/p2p/12D3KooWJbJFaZ3k5sNd8DjQgg3aERoKtBAnirEvPV8yp76kEXHB",
    peerId: "12D3KooWJbJFaZ3k5sNd8DjQgg3aERoKtBAnirEvPV8yp76kEXHB",
  },
  {
    multiaddr:
      "/dns4/5-dar.fluence.dev/tcp/9000/wss/p2p/12D3KooWCKCeqLPSgMnDjyFsJuWqREDtKNHx1JEBiwaMXhCLNTRb",
    peerId: "12D3KooWCKCeqLPSgMnDjyFsJuWqREDtKNHx1JEBiwaMXhCLNTRb",
  },
  {
    multiaddr:
      "/dns4/6-dar.fluence.dev/tcp/9000/wss/p2p/12D3KooWKnRcsTpYx9axkJ6d69LPfpPXrkVLe96skuPTAo76LLVH",
    peerId: "12D3KooWKnRcsTpYx9axkJ6d69LPfpPXrkVLe96skuPTAo76LLVH",
  },
  {
    multiaddr:
      "/dns4/7-dar.fluence.dev/tcp/9000/wss/p2p/12D3KooWBSdm6TkqnEFrgBuSkpVE3dR1kr6952DsWQRNwJZjFZBv",
    peerId: "12D3KooWBSdm6TkqnEFrgBuSkpVE3dR1kr6952DsWQRNwJZjFZBv",
  },
  {
    multiaddr:
      "/dns4/8-dar.fluence.dev/tcp/9000/wss/p2p/12D3KooWGzNvhSDsgFoHwpWHAyPf1kcTYCGeRBPfznL8J6qdyu2H",
    peerId: "12D3KooWGzNvhSDsgFoHwpWHAyPf1kcTYCGeRBPfznL8J6qdyu2H",
  },
  {
    multiaddr:
      "/dns4/9-dar.fluence.dev/tcp/9000/wss/p2p/12D3KooWF7gjXhQ4LaKj6j7ntxsPpGk34psdQicN2KNfBi9bFKXg",
    peerId: "12D3KooWF7gjXhQ4LaKj6j7ntxsPpGk34psdQicN2KNfBi9bFKXg",
  },
  {
    multiaddr:
      "/dns4/10-dar.fluence.dev/tcp/9000/wss/p2p/12D3KooWB9P1xmV3c7ZPpBemovbwCiRRTKd3Kq2jsVPQN4ZukDfy",
    peerId: "12D3KooWB9P1xmV3c7ZPpBemovbwCiRRTKd3Kq2jsVPQN4ZukDfy",
  },
];

export const kras: Relay[] = [
  {
    multiaddr:
      "/dns4/0-kras.fluence.dev/tcp/9000/wss/p2p/12D3KooWSD5PToNiLQwKDXsu8JSysCwUt8BVUJEqCHcDe7P5h45e",
    peerId: "12D3KooWSD5PToNiLQwKDXsu8JSysCwUt8BVUJEqCHcDe7P5h45e",
  },
  {
    multiaddr:
      "/dns4/1-kras.fluence.dev/tcp/9000/wss/p2p/12D3KooWR4cv1a8tv7pps4HH6wePNaK6gf1Hww5wcCMzeWxyNw51",
    peerId: "12D3KooWR4cv1a8tv7pps4HH6wePNaK6gf1Hww5wcCMzeWxyNw51",
  },
  {
    multiaddr:
      "/dns4/2-kras.fluence.dev/tcp/9000/wss/p2p/12D3KooWKnEqMfYo9zvfHmqTLpLdiHXPe4SVqUWcWHDJdFGrSmcA",
    peerId: "12D3KooWKnEqMfYo9zvfHmqTLpLdiHXPe4SVqUWcWHDJdFGrSmcA",
  },
  {
    multiaddr:
      "/dns4/3-kras.fluence.dev/tcp/9000/wss/p2p/12D3KooWHLxVhUQyAuZe6AHMB29P7wkvTNMn7eDMcsqimJYLKREf",
    peerId: "12D3KooWHLxVhUQyAuZe6AHMB29P7wkvTNMn7eDMcsqimJYLKREf",
  },
  {
    multiaddr:
      "/dns4/4-kras.fluence.dev/tcp/9000/wss/p2p/12D3KooWJd3HaMJ1rpLY1kQvcjRPEvnDwcXrH8mJvk7ypcZXqXGE",
    peerId: "12D3KooWJd3HaMJ1rpLY1kQvcjRPEvnDwcXrH8mJvk7ypcZXqXGE",
  },
  {
    multiaddr:
      "/dns4/5-kras.fluence.dev/tcp/9000/wss/p2p/12D3KooWFEwNWcHqi9rtsmDhsYcDbRUCDXH84RC4FW6UfsFWaoHi",
    peerId: "12D3KooWFEwNWcHqi9rtsmDhsYcDbRUCDXH84RC4FW6UfsFWaoHi",
  },
  {
    multiaddr:
      "/dns4/6-kras.fluence.dev/tcp/9000/wss/p2p/12D3KooWCMr9mU894i8JXAFqpgoFtx6qnV1LFPSfVc3Y34N4h4LS",
    peerId: "12D3KooWCMr9mU894i8JXAFqpgoFtx6qnV1LFPSfVc3Y34N4h4LS",
  },
  {
    multiaddr:
      "/dns4/7-kras.fluence.dev/tcp/9000/wss/p2p/12D3KooWDUszU2NeWyUVjCXhGEt1MoZrhvdmaQQwtZUriuGN1jTr",
    peerId: "12D3KooWDUszU2NeWyUVjCXhGEt1MoZrhvdmaQQwtZUriuGN1jTr",
  },
  {
    multiaddr:
      "/dns4/8-kras.fluence.dev/tcp/9000/wss/p2p/12D3KooWEFFCZnar1cUJQ3rMWjvPQg6yMV2aXWs2DkJNSRbduBWn",
    peerId: "12D3KooWEFFCZnar1cUJQ3rMWjvPQg6yMV2aXWs2DkJNSRbduBWn",
  },
  {
    multiaddr:
      "/dns4/9-kras.fluence.dev/tcp/9000/wss/p2p/12D3KooWFtf3rfCDAfWwt6oLZYZbDfn9Vn7bv7g6QjjQxUUEFVBt",
    peerId: "12D3KooWFtf3rfCDAfWwt6oLZYZbDfn9Vn7bv7g6QjjQxUUEFVBt",
  },
  {
    multiaddr:
      "/dns4/10-kras.fluence.dev/tcp/9000/wss/p2p/12D3KooWD7CvsYcpF9HE9CCV9aY3SJ317tkXVykjtZnht2EbzDPm",
    peerId: "12D3KooWD7CvsYcpF9HE9CCV9aY3SJ317tkXVykjtZnht2EbzDPm",
  },
];

export const randomKras = (): Relay => {
  return randomItem(kras);
};

export const randomTestNet = (): Relay => {
  return randomItem(testNet);
};

export const randomStage = (): Relay => {
  return randomItem(stage);
};

function randomItem(arr: Relay[]): Relay {
  const index = randomInt(0, arr.length);
  // This array access always defined
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return arr[index] as Relay;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min;
}
