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
import type { PeerIdB58 } from '@fluencelabs/interfaces';
import type { Subscribable } from 'rxjs';
import { IParticle } from '../particle/interfaces.js';
import { IStartable } from '../util/commonTypes.js';

/**
 * Interface for connection used in Fluence Peer.
 */
export interface IConnection extends IStartable {
    /**
     * Observable that emits particles received from the connection.
     */
    particleSource: Subscribable<IParticle>;

    /**
     * Send particle to the network using the connection.
     * @param nextPeerIds - list of peer ids to send the particle to
     * @param particle - particle to send
     */
    sendParticle(nextPeerIds: PeerIdB58[], particle: IParticle): Promise<void>;

    /**
     * Get peer id of the relay peer. Throws an error if the connection doesn't support relay.
     */
    getRelayPeerId(): PeerIdB58;

    /**
     * Check if the connection supports relay.
     */
    supportsRelay(): boolean;
}
