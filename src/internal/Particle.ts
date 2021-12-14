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

import { v4 as uuidv4 } from 'uuid';
import { fromByteArray, toByteArray } from 'base64-js';
import { CallResultsArray, LogLevel } from '@fluencelabs/avm-runner-interface';
import log from 'loglevel';
import { ParticleContext } from './commonTypes';
import { dataToString, str } from './utils';

export class Particle {
    id: string;
    initPeerId: string;
    timestamp: number;
    ttl: number;
    script: string;
    signature: string;
    data: Uint8Array;
    callResults: CallResultsArray = [];

    static createNew(script: string, ttlMs?: number): Particle {
        const res = new Particle();
        res.id = genUUID();
        res.script = script;
        res.ttl = ttlMs;
        res.data = Buffer.from([]);
        res.timestamp = Date.now();

        return res;
    }

    static fromString(str: string): Particle {
        const json = JSON.parse(str);
        const res = new Particle();
        res.id = json.id;
        res.initPeerId = json.init_peer_id;
        res.timestamp = json.timestamp;
        res.ttl = json.ttl;
        res.script = json.script;
        res.signature = json.signature;
        res.data = toByteArray(json.data);

        return res;
    }

    getParticleContext(): ParticleContext {
        return {
            particleId: this.id,
            initPeerId: this.initPeerId,
            timestamp: this.timestamp,
            ttl: this.ttl,
            signature: this.signature,
        };
    }

    actualTtl(): number {
        return this.timestamp + this.ttl - Date.now();
    }

    hasExpired(): boolean {
        return this.actualTtl() <= 0;
    }

    clone(): Particle {
        const res = new Particle();
        res.id = this.id;
        res.initPeerId = this.initPeerId;
        res.timestamp = this.timestamp;
        res.ttl = this.ttl;
        res.script = this.script;
        res.signature = this.signature;
        res.data = this.data;
        res.callResults = this.callResults;
        return res;
    }

    toString(): string {
        const particle = this;
        const payload = {
            action: 'Particle',
            id: particle.id,
            init_peer_id: particle.initPeerId,
            timestamp: particle.timestamp,
            ttl: particle.ttl,
            script: particle.script,
            // TODO: copy signature from a particle after signatures will be implemented on nodes
            signature: [],
            data: fromByteArray(particle.data),
        };

        return JSON.stringify(payload);
    }

    logTo(level: LogLevel, message: string) {
        let fn;
        let data;
        switch (level) {
            case 'debug':
                fn = log.debug;
                data = dataToString(this.data);
                break;
            case 'error':
                fn = log.error;
                break;
            case 'info':
                fn = log.info;
                break;
            case 'trace':
                fn = log.trace;
                break;
            case 'warn':
                fn = log.warn;
                break;
            default:
                return;
        }

        fn(
            message,
            str({
                id: this.id,
                init_peer_id: this.initPeerId,
                timestamp: this.timestamp,
                ttl: this.ttl,
                script: this.script,
                signature: this.signature,
                callResults: this.callResults,
                data: data,
            }),
        );
    }
}

export type ParticleExecutionStage =
    | { stage: 'received' }
    | { stage: 'interpreted' }
    | { stage: 'interpreterError'; errorMessage: string }
    | { stage: 'localWorkDone' }
    | { stage: 'sent' }
    | { stage: 'sendingError' }
    | { stage: 'expired' };

export interface ParticleQueueItem {
    particle: Particle;
    onStageChange: (state: ParticleExecutionStage) => void;
}

function genUUID() {
    return uuidv4();
}
