import { CallResultsArray, InterpreterResult, RunParameters } from '@fluencelabs/avm';
import { IStartable, JSONArray, JSONObject } from '../util/commonTypes.js';
import { Buffer } from 'buffer';
// @ts-ignore
import type { WorkerImplementation } from 'threads/dist/types/master';

export interface IMarineHost extends IStartable {
    createService(serviceModule: SharedArrayBuffer | Buffer, serviceId: string): Promise<void>;

    removeService(serviceId: string): void;

    containsService(serviceId: string): boolean;

    callService(
        serviceId: string,
        functionName: string,
        args: JSONArray | JSONObject,
        callParams: any,
    ): Promise<unknown>;
}

export interface IAvmRunner extends IStartable {
    run(
        runParams: RunParameters,
        air: string,
        prevData: Uint8Array,
        data: Uint8Array,
        callResults: CallResultsArray,
    ): Promise<InterpreterResult | Error>;
}

export interface IValueLoader<T> {
    getValue(): T;
}

export interface IWasmLoader extends IValueLoader<SharedArrayBuffer | Buffer>, IStartable {}

export interface IWorkerLoader extends IValueLoader<WorkerImplementation>, IStartable {}

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
