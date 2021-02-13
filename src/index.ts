/*
 * Copyright 2020 Fluence Labs Limited
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


export { seedToPeerId, peerIdToSeed, generatePeerId } from './internal/peerIdUtils';
export { FluenceClient } from './FluenceClient';
export { SecurityTetraplet, PeerIdB58 } from './internal/commonTypes';
export * from './api';
export { Particle } from './internal/particle';
export * from './internal/builtins';

import log, {LogLevelDesc} from "loglevel";
function testLog() {
    log.trace('TRACE testLog');
    log.debug('DEBUG testLog');
    log.info('INFO testLog');
    log.warn('WARN testLog');
    log.error('ERROR testLog');
}

console.log("index.ts: current level is " + log.getLevel());

function setLogLevelWtf(level: LogLevelDesc) {
    log.setLevel(level);
}

function setCurrentLevel() {
    console.log("current level is " + log.getLevel());
    log.setLevel(log.getLevel());
}

export { testLog, setLogLevelWtf, setCurrentLevel };


