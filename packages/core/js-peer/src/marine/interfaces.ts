import { CallResultsArray, InterpreterResult, RunParameters } from '@fluencelabs/avm';
import { IModule, JSONArray, JSONObject } from '../util/commonTypes.js';
// @ts-ignore
import type { WorkerImplementation } from 'threads/dist/types/master';

export interface IMarineHost extends IModule {
    createService(serviceModule: SharedArrayBuffer | Buffer, serviceId: string): Promise<void>;

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
