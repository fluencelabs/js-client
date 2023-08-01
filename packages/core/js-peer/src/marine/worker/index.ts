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

import type { JSONArray, JSONObject } from '@fluencelabs/marine-js/dist/types';
import { LogFunction, logLevelToEnv } from '@fluencelabs/marine-js/dist/types';
import type { MarineBackgroundInterface } from '../worker-script/index.js';
// @ts-ignore
import { spawn, Thread } from 'threads';
// @ts-ignore
import type { ModuleThread } from 'threads';
import { Buffer } from 'buffer';

import { MarineLogger, marineLogger } from '../../util/logger.js';
import { IMarineHost, IWasmLoader, IWorkerLoader } from '../interfaces.js';
// @ts-ignore
import type { WorkerImplementation } from 'threads/dist/types/master';

export class MarineBackgroundRunner implements IMarineHost {
    private marineServices = new Set<string>();
    private workerThread?: ModuleThread<MarineBackgroundInterface>;

    private loggers: Map<string, MarineLogger> = new Map();

    constructor(private worker: WorkerImplementation, private controlModuleLoader: IWasmLoader) {}

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
        await this.controlModuleLoader.start();
        const wasm = this.controlModuleLoader.getValue();
        this.workerThread = await spawn<MarineBackgroundInterface>(this.worker, { timeout: 99999999 });
        const logfn: LogFunction = (message) => {
            const serviceLogger = this.loggers.get(message.service);
            if (!serviceLogger) {
                return;
            }
            serviceLogger[message.level](message.message);
        };
        this.workerThread.onLogMessage().subscribe(logfn);
        await this.workerThread.init(wasm);
    }

    async createService(serviceModule: SharedArrayBuffer | Buffer, serviceId: string): Promise<void> {
        if (!this.workerThread) {
            throw 'Worker is not initialized';
        }

        // The logging level is controlled by the environment variable passed to enable debug logs.
        // We enable all possible log levels passing the control for exact printouts to the logger
        const env = logLevelToEnv('trace');
        this.loggers.set(serviceId, marineLogger(serviceId));
        await this.workerThread.createService(serviceModule, serviceId, undefined, env);
        this.marineServices.add(serviceId);
    }

    callService(
        serviceId: string,
        functionName: string,
        args: JSONArray | JSONObject,
        callParams: any,
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
