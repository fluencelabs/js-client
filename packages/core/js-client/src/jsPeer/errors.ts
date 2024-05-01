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

/**
 * Throw when particle times out, e.g. haven't been resolved after TTL is expired
 */
export class ExpirationError extends Error {}

/**
 * Throws when AquaVM interpreter returns an error while executing air script. It could be badly written air or internal bug.
 */
export class InterpreterError extends Error {}

/**
 * Throws when network error occurs while sending particle to relay peer.
 */
export class SendError extends Error {}
