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

import debug from "debug";

type Logger = (formatter: unknown, ...args: unknown[]) => void;

export interface CommonLogger {
  error: Logger;
  trace: Logger;
  debug: Logger;
}

export interface MarineLogger {
  warn: Logger;
  error: Logger;
  debug: Logger;
  trace: Logger;
  info: Logger;
}

export function logger(name: string): CommonLogger {
  return {
    error: debug(`fluence:${name}:error`),
    trace: debug(`fluence:${name}:trace`),
    debug: debug(`fluence:${name}:debug`),
  };
}

export function marineLogger(serviceId: string): MarineLogger {
  const name = `fluence:marine:${serviceId}`;
  return {
    warn: debug(`${name}:warn`),
    error: debug(`${name}:error`),
    debug: debug(`${name}:debug`),
    trace: debug(`${name}:trace`),
    info: debug(`${name}:info`),
  };
}
