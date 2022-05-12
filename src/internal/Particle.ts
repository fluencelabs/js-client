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
import log from 'loglevel';
import { ParticleContext } from './commonTypes';
import { dataToString, jsonify } from './utils';
import Buffer from './Buffer';
import { CallResultsArray, LogLevel } from '@fluencelabs/avm';

export class Particle {
    // TODO: make it not optional (should be added to the constructor)
    signature?: string;
    callResults: CallResultsArray = [];

    constructor(
        public id: string,
        public timestamp: number,
        public script: string,
        public data: Uint8Array,
        public ttl: number,
        public initPeerId: string,
    ) {}

    static createNew(script: string, ttl: number, initPeerId: string): Particle {
        return new Particle(genUUID(), Date.now(), script, Buffer.from([]), ttl, initPeerId);
    }

    static fromString(str: string): Particle {
        const json = JSON.parse(str);
        const res = new Particle(
            json.id,
            json.timestamp,
            json.script,
            toByteArray(json.data),
            json.ttl,
            json.init_peer_id,
        );

        res.signature = json.signature;

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
        const res = new Particle(this.id, this.timestamp, this.script, this.data, this.ttl, this.initPeerId);

        res.signature = this.signature;
        res.callResults = this.callResults;
        return res;
    }

    toString(): string {
        return JSON.stringify({
            action: 'Particle',
            id: this.id,
            init_peer_id: this.initPeerId,
            timestamp: this.timestamp,
            ttl: this.ttl,
            script: this.script,
            // TODO: copy signature from a particle after signatures will be implemented on nodes
            signature: [],
            data: this.data && fromByteArray(this.data),
        });
    }

    logTo(level: LogLevel, message: string) {
        let fn;
        let data: string | undefined;
        switch (level) {
            case 'debug':
                fn = log.debug;
                data = dataToString(this.data);
                break;
            case 'error':
                fn = log.error;
                break;
            case 'info':
            case 'trace':
                fn = log.info;
                break;
            case 'warn':
                fn = log.warn;
                break;
            default:
                return;
        }

        fn(
            message,
            jsonify({
                id: this.id,
                init_peer_id: this.initPeerId,
                timestamp: this.timestamp,
                ttl: this.ttl,
                script: this.script,
                signature: this.signature,
                callResults: this.callResults,
                data,
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
