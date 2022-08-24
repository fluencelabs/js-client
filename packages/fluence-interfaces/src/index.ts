/*
 * Copyright 2020 Fluence Labs Limited
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

export type PeerIdB58 = string;

export type ParticleHandler = (particle: string) => void;

/**
 * Base class for connectivity layer to Fluence Network
 */
export abstract class FluenceConnection {
    abstract readonly relayPeerId: PeerIdB58 | null;
    abstract connect(onIncomingParticle: ParticleHandler): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract sendParticle(nextPeerIds: PeerIdB58[], particle: string): Promise<void>;
}
