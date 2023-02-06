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

import type { JSONArray, JSONObject, LogLevel } from '@fluencelabs/marine-js/dist/types';
import { LogFunction, logLevelToEnv } from '@fluencelabs/marine-js/dist/types';
import type { IMarine, IWorkerLoader, IWasmLoader } from '../../interfaces/index.js';
import type { MarineBackgroundInterface } from '../worker-script/index.js';
import { spawn, Thread } from 'threads';
import type { ModuleThread } from 'threads';

export class MarineBackgroundRunner implements IMarine {
    private workerThread?: ModuleThread<MarineBackgroundInterface>;

    constructor(
        private workerLoader: IWorkerLoader,
        private controlModuleLoader: IWasmLoader,
        private logFunction: LogFunction,
    ) {}

    async start(): Promise<void> {
        if (this.workerThread) {
            return;
        }

        await this.workerLoader.start();
        await this.controlModuleLoader.start();
        const worker = this.workerLoader.getValue();
        const wasm = this.controlModuleLoader.getValue();
        this.workerThread = await spawn<MarineBackgroundInterface>(worker, { timeout: 99999999 });
        this.workerThread.onLogMessage().subscribe(this.logFunction);
        await this.workerThread.init(wasm);
    }

    createService(serviceModule: SharedArrayBuffer | Buffer, serviceId: string, logLevel?: LogLevel): Promise<void> {
        if (!this.workerThread) {
            throw 'Worker is not initialized';
        }

        const env = logLevel ? logLevelToEnv(logLevel) : {};
        return this.workerThread.createService(serviceModule, serviceId, undefined, env);
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

        await this.workerThread.terminate();
        await Thread.terminate(this.workerThread);
    }
}
