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

import type { JSONArray, JSONObject, LogLevel } from '@fluencelabs/marine-js/dist/types';
import type { RunParameters, CallResultsArray, InterpreterResult } from '@fluencelabs/avm';
import type { WorkerImplementation } from 'threads/dist/types/master';
import { PeerConfig } from './peerConfig';

export type PeerIdB58 = string;

export type ParticleHandler = (particle: string) => void;

/**
 * Information about Fluence Peer connection.
 * Represented as object with the following keys:
 * - `isInitialized`: Is the peer initialized or not.
 * - `peerId`: Peer Id of the peer. Null if the peer is not initialized
 * - `isConnected`: Is the peer connected to network or not
 * - `relayPeerId`: Peer Id of the relay the peer is connected to. If the connection is direct relayPeerId is null
 * - `isDirect`: True if the peer is connected to the network directly (not through relay)
 */
export type PeerStatus =
    | {
          isInitialized: false;
          peerId: null;
          isConnected: false;
          relayPeerId: null;
      }
    | {
          isInitialized: true;
          peerId: PeerIdB58;
          isConnected: false;
          relayPeerId: null;
      }
    | {
          isInitialized: true;
          peerId: PeerIdB58;
          isConnected: true;
          relayPeerId: PeerIdB58;
      }
    | {
          isInitialized: true;
          peerId: PeerIdB58;
          isConnected: true;
          isDirect: true;
          relayPeerId: null;
      };

export interface IFluencePeer {
    start(config?: PeerConfig): Promise<void>;
    stop(): Promise<void>;
    getStatus(): PeerStatus;

    // TODO: come up with a working interface for
    // - particle creation
    // - particle initialization
    // - service registration
    internals: any;
}

export const asFluencePeer = (fluencePeerCandidate: unknown): IFluencePeer => {
    if (isFluencePeer(fluencePeerCandidate)) {
        return fluencePeerCandidate;
    }

    throw new Error('');
};

export const isFluencePeer = (fluencePeerCandidate: unknown): fluencePeerCandidate is IFluencePeer => {
    if (fluencePeerCandidate && (fluencePeerCandidate as any).__isFluenceAwesome) {
        return true;
    }

    return false;
};

/**
 * Base class for connectivity layer to Fluence Network
 */
export abstract class FluenceConnection {
    abstract readonly relayPeerId: PeerIdB58 | null;
    abstract connect(onIncomingParticle: ParticleHandler): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract sendParticle(nextPeerIds: PeerIdB58[], particle: string): Promise<void>;
}

export interface IMarine extends IModule {
    createService(serviceModule: SharedArrayBuffer | Buffer, serviceId: string, logLevel?: LogLevel): Promise<void>;

    callService(
        serviceId: string,
        functionName: string,
        args: JSONArray | JSONObject,
        callParams: any,
    ): Promise<unknown>;
}

export interface IAvmRunner extends IModule {
    run(
        runParams: RunParameters,
        air: string,
        prevData: Uint8Array,
        data: Uint8Array,
        callResults: CallResultsArray,
    ): Promise<InterpreterResult | Error>;
}

export interface IModule {
    start(): Promise<void>;
    stop(): Promise<void>;
}

export interface IValueLoader<T> {
    getValue(): T;
}

export interface IWasmLoader extends IValueLoader<SharedArrayBuffer | Buffer>, IModule {}

export interface IWorkerLoader extends IValueLoader<WorkerImplementation>, IModule {}

export class LazyLoader<T> implements IModule, IValueLoader<T> {
    private value: T | null = null;

    constructor(private loadValue: () => Promise<T> | T) {}

    getValue(): T {
        if (this.value == null) {
            throw new Error('Value has not been loaded. Call `start` method to load the value.');
        }

        return this.value;
    }

    async start() {
        if (this.value !== null) {
            return;
        }

        this.value = await this.loadValue();
    }

    async stop() {}
}
