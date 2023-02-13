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

import { MarineService } from '@fluencelabs/marine-js/dist/MarineService';
import type { Env, MarineServiceConfig } from '@fluencelabs/marine-js/dist/config';
import type { JSONArray, JSONObject, LogMessage } from '@fluencelabs/marine-js/dist/types';
import { Observable, Subject } from 'threads/observable';
import { expose } from 'threads/worker';

let marineServices = new Map<string, MarineService>();
let controlModule: WebAssembly.Module | undefined;

const onLogMessage = new Subject<LogMessage>();

const asArray = (buf: SharedArrayBuffer | Buffer) => {
    return new Uint8Array(buf);
};

const toExpose = {
    init: async (controlModuleWasm: SharedArrayBuffer | Buffer): Promise<void> => {
        controlModule = await WebAssembly.compile(asArray(controlModuleWasm));
    },

    createService: async (
        wasm: SharedArrayBuffer | Buffer,
        serviceId: string,
        marineConfig?: MarineServiceConfig,
        envs?: Env,
    ): Promise<void> => {
        if (!controlModule) {
            throw new Error('MarineJS is not initialized. To initialize call `init` function');
        }

        const service = await WebAssembly.compile(asArray(wasm));
        const srv = new MarineService(
            controlModule,
            service,
            serviceId,
            onLogMessage.next.bind(onLogMessage),
            marineConfig,
            envs,
        );
        await srv.init();
        marineServices.set(serviceId, srv);
    },

    terminate: () => {
        marineServices.forEach((val, key) => {
            val.terminate();
        });
        onLogMessage.complete();
    },

    callService: (serviceId: string, functionName: string, args: JSONArray | JSONObject, callParams: any): unknown => {
        const srv = marineServices.get(serviceId);
        if (!srv) {
            throw new Error(`service with id=${serviceId} not found`);
        }

        return srv.call(functionName, args, callParams);
    },

    onLogMessage(): Observable<LogMessage> {
        return Observable.from(onLogMessage);
    },
};

export type MarineBackgroundInterface = typeof toExpose;

expose(toExpose);
