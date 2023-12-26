/**
 * Copyright 2023 Fluence Labs Limited
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

import { JSONValue } from "@fluencelabs/interfaces";
import type {
  MarineBackgroundInterface,
  LogFunction,
  JSONValueNonNullable,
  CallParameters,
} from "@fluencelabs/marine-worker";
import { ModuleThread, Thread } from "@fluencelabs/threads/master";

import { MarineLogger, marineLogger } from "../../util/logger.js";
import { IMarineHost } from "../interfaces.js";

export class MarineBackgroundRunner implements IMarineHost {
  private loggers = new Map<string, MarineLogger>();

  constructor(
    private marineJsWasm: ArrayBuffer,
    private avmWasm: ArrayBuffer,
    private workerThread: ModuleThread<MarineBackgroundInterface>,
  ) {}

  async hasService(serviceId: string) {
    return this.workerThread.hasService(serviceId);
  }

  async removeService(serviceId: string) {
    await this.workerThread.removeService(serviceId);
  }

  async start(): Promise<void> {
    const logfn: LogFunction = (message) => {
      const serviceLogger = this.loggers.get(message.service);

      if (serviceLogger === undefined) {
        return;
      }

      serviceLogger[message.level](message.message);
    };

    this.workerThread.onLogMessage().subscribe(logfn);
    await this.workerThread.init(this.marineJsWasm);
    await this.createService(this.avmWasm, "avm");
  }

  async createService(
    serviceModule: ArrayBuffer | SharedArrayBuffer,
    serviceId: string,
  ): Promise<void> {
    this.loggers.set(serviceId, marineLogger(serviceId));
    await this.workerThread.createService(serviceModule, serviceId);
  }

  async callService(
    serviceId: string,
    functionName: string,
    args: Array<JSONValueNonNullable> | Record<string, JSONValueNonNullable>,
    callParams?: CallParameters,
  ): Promise<JSONValue> {
    return this.workerThread.callService(
      serviceId,
      functionName,
      args,
      callParams,
    );
  }

  async stop(): Promise<void> {
    await this.workerThread.terminate();
    await Thread.terminate(this.workerThread);
  }
}
