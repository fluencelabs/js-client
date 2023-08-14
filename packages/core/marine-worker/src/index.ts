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
import type { JSONArray, JSONObject, LogMessage, CallParameters } from '@fluencelabs/marine-js/dist/types';
import { Observable, Subject } from 'observable-fns';
// @ts-ignore no types provided for package
import { expose } from 'threads';
import * as Buffer from 'buffer';

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

let marineServices = new Map<string, MarineService>();
let controlModule: WebAssembly.Module | undefined;
const onLogMessage = new Subject<LogMessage>();

const toExpose = {
    init: (controlModuleWasm: SharedArrayBuffer | Buffer) => {
        controlModule = new WebAssembly.Module(new Uint8Array(controlModuleWasm));
    },

    createService: async (
        wasm: SharedArrayBuffer | Buffer,
        serviceId: string,
        envs?: Env,
    ): Promise<void> => {
        if (!controlModule) {
            throw new Error('MarineJS is not initialized. To initialize call `init` function');
        }

        if (marineServices.has(serviceId)) {
            throw new Error(`Service with name ${serviceId} already registered`);
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

    hasService: (serviceId: string) => {
        return marineServices.has(serviceId);
    },

    removeService: (serviceId: string) => {
        marineServices.get(serviceId)?.terminate();
        return marineServices.delete(serviceId);
    },

    terminate: () => {
        marineServices.forEach((val, key) => {
            val.terminate();
        });
        marineServices.clear();
        onLogMessage.complete();
    },

    callService: (serviceId: string, functionName: string, args: JSONArray | JSONObject, callParams: CallParameters): unknown => {
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
