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

import { Marine } from '@fluencelabs/marine-js';
import type { Env, MarineServiceConfig, JSONArray, JSONObject, LogMessage } from '@fluencelabs/marine-js';
import { Subject } from 'threads/observable';
import { expose } from 'threads';

let marine: Marine;

const onLogMessage = new Subject<LogMessage>();

const toExpose = {
    init: async (controlModuleWasm: SharedArrayBuffer | Buffer): Promise<void> => {
        marine = new Marine(onLogMessage.next);
        return marine.init(controlModuleWasm);
    },

    createService: async (
        wasm: SharedArrayBuffer | Buffer,
        serviceId: string,
        marineConfig?: MarineServiceConfig,
        envs?: Env,
    ): Promise<void> => {
        return marine.createService(wasm, serviceId, marineConfig, envs);
    },

    terminate: async (): Promise<void> => {
        return marine.terminate();
    },

    callService: async (
        serviceId: string,
        functionName: string,
        args: JSONArray | JSONObject,
        callParams: any,
    ): Promise<unknown> => {
        return marine.callService(serviceId, functionName, args, callParams);
    },

    onLogMessage(): typeof onLogMessage {
        return onLogMessage;
    },
};

export type MarineBackgroundInterface = typeof toExpose;

expose(toExpose);
