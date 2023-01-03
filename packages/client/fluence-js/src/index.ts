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
export { KeyPair } from '@fluencelabs/keypair';

import { FluencePeer, PeerConfig } from '@fluencelabs/js-peer/dist/FluencePeer';
import { isBrowser, isNode } from 'browser-or-node';

export { PeerStatus } from '@fluencelabs/js-peer/dist/FluencePeer';
export { FluencePeer, PeerConfig } from '@fluencelabs/js-peer/dist/FluencePeer';
export { PeerIdB58, CallParams } from '@fluencelabs/js-peer/dist/commonTypes';

export const setLogLevel = (level: LogLevelDesc) => {
    log.setLevel(level);
};

log.setDefaultLevel('WARN');

let pkg: string;
if (isBrowser) {
    pkg = '@fluencelabs/js-client.web';
} else if (isNode) {
    pkg = '@fluencelabs/js-client.node';
} else {
    throw new Error('Unknown environment');
}

const { makeDefaultPeer } = require(pkg);

const defaultPeer = makeDefaultPeer();
// @ts-ignore
globalThis.defaultPeer = defaultPeer;

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

    /**
     * Registers marine service within the default Fluence peer from wasm file.
     * Following helper functions can be used to load wasm files:
     * * loadWasmFromFileSystem
     * * loadWasmFromNpmPackage
     * * loadWasmFromServer
     * @param wasm - buffer with the wasm file for service
     * @param serviceId - the service id by which the service can be accessed in aqua
     */
    registerMarineService: (wasm: SharedArrayBuffer | Buffer, serviceId: string): Promise<void> => {
        return defaultPeer.registerMarineService(wasm, serviceId);
    },

    /**
     * Removes the specified marine service from the default Fluence peer
     * @param serviceId - the service id to remove
     */
    removeMarineService: (serviceId: string): void => {
        defaultPeer.removeMarineService(serviceId);
    },
};
