/**
 * Copyright 2024 Fluence DAO
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

import type {
  Env,
  MarineServiceConfig,
  ModuleDescriptor,
} from "@fluencelabs/marine-js/dist/config";
import { MarineService } from "@fluencelabs/marine-js/dist/MarineService";
import type {
  CallParameters,
  JSONArray,
  JSONObject,
  LogMessage,
} from "@fluencelabs/marine-js/dist/types";
import {
  defaultCallParameters,
  logLevelToEnv,
} from "@fluencelabs/marine-js/dist/types";
import { expose } from "@fluencelabs/threads/worker";
import { Observable, Subject } from "observable-fns";

const createSimpleModuleDescriptor = (
  name: string,
  envs?: Env,
): ModuleDescriptor => {
  return {
    import_name: name,
    config: {
      logger_enabled: true,
      logging_mask: 0,
      wasi: {
        envs: { ...envs },
        preopened_files: new Set(),
        mapped_dirs: new Map(),
      },
    },
  };
};

const createSimpleMarineService = (
  name: string,
  env?: Env,
): MarineServiceConfig => {
  return {
    modules_config: [createSimpleModuleDescriptor(name, env)],
  };
};

const marineServices = new Map<string, MarineService>();
let controlModule: WebAssembly.Module | undefined;
const onLogMessage = new Subject<LogMessage>();

const toExpose = {
  init: (controlModuleWasm: ArrayBuffer | SharedArrayBuffer) => {
    controlModule = new WebAssembly.Module(new Uint8Array(controlModuleWasm));
  },

  createService: async (
    wasm: ArrayBuffer | SharedArrayBuffer,
    serviceId: string,
    envs?: Env,
  ): Promise<void> => {
    if (controlModule === undefined) {
      throw new Error(
        "MarineJS is not initialized. To initialize call `init` function",
      );
    }

    if (marineServices.has(serviceId)) {
      throw new Error(`Service with name ${serviceId} already registered`);
    }

    const marineConfig = createSimpleMarineService(serviceId, {
      // We enable all possible log levels passing the control for exact printouts to the logger
      ...logLevelToEnv("info"),
      ...envs,
    });

    const modules = { [serviceId]: new Uint8Array(wasm) };

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
    if (serviceId === "avm") {
      throw new Error("Cannot remove 'avm' service");
    }

    marineServices.get(serviceId)?.terminate();
    return marineServices.delete(serviceId);
  },

  terminate: () => {
    marineServices.forEach((val) => {
      val.terminate();
    });

    marineServices.clear();
    onLogMessage.complete();
  },

  callService: (
    serviceId: string,
    functionName: string,
    args: JSONArray | JSONObject,
    callParams: CallParameters = defaultCallParameters,
  ) => {
    const srv = marineServices.get(serviceId);

    if (srv === undefined) {
      throw new Error(`service with id=${serviceId} not found`);
    }

    return srv.call(functionName, args, callParams);
  },

  onLogMessage() {
    return Observable.from(onLogMessage);
  },
};

export type MarineBackgroundInterface = typeof toExpose;
export type {
  LogFunction,
  LogMessage,
  JSONValue as JSONValueNonNullable,
  CallParameters,
} from "@fluencelabs/marine-js/dist/types";

expose(toExpose);
