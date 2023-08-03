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
import type { Env, MarineModuleConfig, MarineServiceConfig, ModuleDescriptor } from '@fluencelabs/marine-js/dist/config'
import type { JSONArray, JSONObject, LogMessage } from '@fluencelabs/marine-js/dist/types';
import { Buffer } from 'buffer';
// @ts-ignore
import { Observable, Subject } from 'threads/observable';
// @ts-ignore
import { expose } from 'threads/worker';

let marineServices = new Map<string, MarineService>();
let controlModule: WebAssembly.Module | undefined;

const createSimpleModuleDescriptor = (name: string, envs?: Env): ModuleDescriptor => {
    return {
        import_name: name,
        config: {
            logger_enabled: true,
            logging_mask: 0,
            wasi: {
                envs: {...envs},
                preopened_files: new Set(),
                mapped_dirs: new Map,
            }
        }
    }
}
const createSimpleMarineService = (name: string, env? : Env): MarineServiceConfig => {
    return {
        modules_config: [createSimpleModuleDescriptor(name, env)],
    }
}

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
        envs?: Env,
    ): Promise<void> => {
        if (!controlModule) {
            throw new Error('MarineJS is not initialized. To initialize call `init` function');
        }

        const marineConfig = createSimpleMarineService(serviceId, envs);
        const modules = {[serviceId]: new Uint8Array(wasm)}
        const srv = new MarineService(
            controlModule,
            serviceId,
            onLogMessage.next.bind(onLogMessage),
            marineConfig,
            modules,
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
