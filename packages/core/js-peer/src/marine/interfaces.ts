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
import { CallResultsArray, InterpreterResult, RunParameters } from '@fluencelabs/avm';
import { IStartable, JSONArray, JSONObject } from '../util/commonTypes.js';
import { Buffer } from 'buffer';
// @ts-ignore
import type { WorkerImplementation } from 'threads/dist/types/master';

/**
 * Contract for marine host implementations. Marine host is responsible for creating calling and removing marine services
 */
export interface IMarineHost extends IStartable {
    /**
     * Creates marine service from the given module and service id
     */
    createService(serviceModule: SharedArrayBuffer | Buffer, serviceId: string): Promise<void>;

    /**
     * Removes marine service with the given service id
     */
    removeService(serviceId: string): void;

    /**
     * Returns true if any service with the specified service id is registered
     */
    hasService(serviceId: string): boolean;

    /**
     * Calls the specified function of the specified service with the given arguments
     */
    callService(
        serviceId: string,
        functionName: string,
        args: JSONArray | JSONObject,
        callParams: any,
    ): Promise<unknown>;
}

/**
 * Interface for different implementations of AVM runner
 */
export interface IAvmRunner extends IStartable {
    /**
     * Run AVM interpreter with the specified parameters
     */
    run(
        runParams: RunParameters,
        air: string,
        prevData: Uint8Array,
        data: Uint8Array,
        callResults: CallResultsArray,
    ): Promise<InterpreterResult | Error>;
}

/**
 * Interface for something which can hold a value
 */
export interface IValueLoader<T> {
    getValue(): T;
}

/**
 * Interface for something which can load wasm files
 */
export interface IWasmLoader extends IValueLoader<SharedArrayBuffer | Buffer>, IStartable {}

/**
 * Interface for something which can thread.js based worker
 */
export interface IWorkerLoader extends IValueLoader<WorkerImplementation>, IStartable {}

/**
 * Lazy loader for some value. Value is loaded only when `start` method is called
 */
export class LazyLoader<T> implements IStartable, IValueLoader<T> {
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
