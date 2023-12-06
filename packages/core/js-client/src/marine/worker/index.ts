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
import {
  ModuleThread,
  Thread,
  spawn,
  Worker,
} from "@fluencelabs/threads/master";

import { MarineLogger, marineLogger } from "../../util/logger.js";
import { IMarineHost } from "../interfaces.js";

export class MarineBackgroundRunner implements IMarineHost {
  private workerThread?: ModuleThread<MarineBackgroundInterface>;

  private loggers = new Map<string, MarineLogger>();

  constructor(
    private marineJsWasm: ArrayBuffer,
    private avmWasm: ArrayBuffer,
    private worker: Worker,
  ) {}

  async hasService(serviceId: string) {
    if (this.workerThread == null) {
      throw new Error("Worker is not initialized");
    }

    return this.workerThread.hasService(serviceId);
  }

  async removeService(serviceId: string) {
    if (this.workerThread == null) {
      throw new Error("Worker is not initialized");
    }

    await this.workerThread.removeService(serviceId);
  }

  async start(): Promise<void> {
    if (this.workerThread != null) {
      throw new Error("Worker thread already initialized");
    }

    const workerThread: ModuleThread<MarineBackgroundInterface> =
      await spawn<MarineBackgroundInterface>(this.worker);

    const logfn: LogFunction = (message) => {
      const serviceLogger = this.loggers.get(message.service);

      if (serviceLogger == null) {
        return;
      }

      serviceLogger[message.level](message.message);
    };

    workerThread.onLogMessage().subscribe(logfn);
    await workerThread.init(this.marineJsWasm);
    this.workerThread = workerThread;
    await this.createService(this.avmWasm, "avm");
  }

  async createService(
    serviceModule: ArrayBuffer | SharedArrayBuffer,
    serviceId: string,
  ): Promise<void> {
    if (this.workerThread == null) {
      throw new Error("Worker is not initialized");
    }

    this.loggers.set(serviceId, marineLogger(serviceId));
    await this.workerThread.createService(serviceModule, serviceId);
  }

  async callService(
    serviceId: string,
    functionName: string,
    args: Array<JSONValueNonNullable> | Record<string, JSONValueNonNullable>,
    callParams?: CallParameters,
  ): Promise<JSONValue> {
    if (this.workerThread == null) {
      throw new Error("Worker is not initialized");
    }

    return this.workerThread.callService(
      serviceId,
      functionName,
      args,
      callParams,
    );
  }

  async stop(): Promise<void> {
    if (this.workerThread == null) {
      return;
    }

    await this.workerThread.terminate();
    await Thread.terminate(this.workerThread);
  }
}
