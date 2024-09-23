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

export const nodes = [
  {
    multiaddr:
      "/ip4/127.0.0.1/tcp/999/ws/p2p/12D3KooWBbMuqJJZT7FTFN4fWg3k3ipUKx6KEy7pDy8mdorK5g5o",
    peerId: "12D3KooWBbMuqJJZT7FTFN4fWg3k3ipUKx6KEy7pDy8mdorK5g5o",
  },
] as const;

export const RELAY = nodes[0].multiaddr;
