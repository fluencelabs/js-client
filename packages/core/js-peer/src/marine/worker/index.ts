/*
 * Copyright 2022 Fluence Labs Limited
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

import type { JSONArray, JSONObject, CallParameters } from '@fluencelabs/marine-js/dist/types';
import { LogFunction, logLevelToEnv } from '@fluencelabs/marine-js/dist/types';
import type { MarineBackgroundInterface } from '@fluencelabs/marine-worker';
// @ts-ignore
import type { ModuleThread } from 'threads';
import { Buffer } from 'buffer';
// @ts-ignore
import { spawn, Thread } from 'threads';

import { MarineLogger, marineLogger } from '../../util/logger.js';
import { IMarineHost, IWasmLoader, IWorkerLoader } from '../interfaces.js';

export class MarineBackgroundRunner implements IMarineHost {
    private marineServices = new Set<string>();
    private workerThread?: ModuleThread<MarineBackgroundInterface>;

    private loggers: Map<string, MarineLogger> = new Map();

    constructor(private workerLoader: IWorkerLoader, private controlModuleLoader: IWasmLoader, private avmWasmLoader: IWasmLoader) {}

    hasService(serviceId: string): boolean {
        return this.marineServices.has(serviceId);
    }

    removeService(serviceId: string): void {
        this.marineServices.delete(serviceId);
    }

    async start(): Promise<void> {
        if (this.workerThread) {
            return;
        }

        this.marineServices = new Set();
        await this.workerLoader.start();
        const worker = await this.workerLoader.getValue();
        await this.controlModuleLoader.start();
        const wasm = this.controlModuleLoader.getValue();
        
        await this.avmWasmLoader.start();
        
        console.log('before spawn');
        this.workerThread = await spawn<MarineBackgroundInterface>(worker);
        console.log('after spawn');
        const logfn: LogFunction = (message) => {
            const serviceLogger = this.loggers.get(message.service);
            if (!serviceLogger) {
                return;
            }
            serviceLogger[message.level](message.message);
        };
        this.workerThread.onLogMessage().subscribe(logfn);
        await this.workerThread.init(wasm);
        await this.createService(this.avmWasmLoader.getValue(), 'avm');
    }

    async createService(serviceModule: SharedArrayBuffer | Buffer, serviceId: string): Promise<void> {
        if (!this.workerThread) {
            throw 'Worker is not initialized';
        }

        // The logging level is controlled by the environment variable passed to enable debug logs.
        // We enable all possible log levels passing the control for exact printouts to the logger
        const env = logLevelToEnv('trace');
        this.loggers.set(serviceId, marineLogger(serviceId));
        await this.workerThread.createService(serviceModule, serviceId, env);
        this.marineServices.add(serviceId);
    }

    callService(
        serviceId: string,
        functionName: string,
        args: JSONArray | JSONObject,
        callParams: CallParameters,
    ): Promise<unknown> {
        if (!this.workerThread) {
            throw 'Worker is not initialized';
        }

        return this.workerThread.callService(serviceId, functionName, args, callParams);
    }

    async stop(): Promise<void> {
        if (!this.workerThread) {
            return;
        }

        this.marineServices.clear();
        await this.workerThread.terminate();
        await Thread.terminate(this.workerThread);
    }
}
