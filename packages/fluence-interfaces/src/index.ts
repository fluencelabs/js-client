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

import type { JSONArray, JSONObject, LogLevel } from '@fluencelabs/marine-js';
import type { RunParameters, CallResultsArray, InterpreterResult } from '@fluencelabs/avm';
import type { WorkerImplementation } from 'threads/dist/types/master';
export type PeerIdB58 = string;

export type ParticleHandler = (particle: string) => void;

/**
 * Base class for connectivity layer to Fluence Network
 */
export abstract class FluenceConnection implements IModule {
    onIncomingParticle: ParticleHandler;
    abstract readonly relayPeerId: PeerIdB58 | null;
    abstract start(): Promise<void>;
    abstract stop(): Promise<void>;
    abstract isConnected(): boolean;
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

    constructor(private loadValue: () => Promise<T>) {}

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
