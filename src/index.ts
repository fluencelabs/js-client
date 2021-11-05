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

import log, { LogLevelDesc } from 'loglevel';
import { FluencePeer, PeerConfig } from './internal/FluencePeer';

export { PeerStatus } from './internal/FluencePeer';
export { KeyPair } from './internal/KeyPair';
export { FluencePeer, AvmLoglevel, PeerConfig } from './internal/FluencePeer';
export { PeerIdB58, CallParams } from './internal/commonTypes';

export const setLogLevel = (level: LogLevelDesc) => {
    log.setLevel(level);
};

log.setDefaultLevel('WARN');

const defaultPeer = new FluencePeer();

/**
 * Public interface to Fluence JS
 */
export const Fluence = {
    /**
     * Initializes the default peer: starts the Aqua VM, initializes the default call service handlers
     * and (optionally) connect to the Fluence network
     * @param config - object specifying peer configuration
     */
    start: (config?: PeerConfig): Promise<void> => {
        return defaultPeer.start(config);
    },

    /**
     * Un-initializes the default peer: stops all the underlying workflows, stops the Aqua VM
     * and disconnects from the Fluence network
     */
    stop: (): Promise<void> => {
        return defaultPeer.stop();
    },

    /**
     * Get the default peer's status
     * @returns Default peer's status
     */
    getStatus: () => {
        return defaultPeer.getStatus();
    },

    /**
     * Get the default peer instance
     * @returns the default peer instance
     */
    getPeer: (): FluencePeer => {
        return defaultPeer;
    },
};
