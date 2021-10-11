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
import { CallResultsArray, LogLevel } from '@fluencelabs/avm';
import { CallServiceHandler } from './CallServiceHandler';
import log from 'loglevel';

const DefaultTTL = 7000;

export class Particle {
    id: string;
    init_peer_id: string;
    timestamp: number;
    ttl: number;
    script: string;
    signature: string;
    data: Uint8Array;
    callResults: CallResultsArray = [];

    actualTtl(): number {
        return this.timestamp + this.ttl - Date.now();
    }

    hasExpired(): boolean {
        return this.actualTtl() <= 0;
    }

    clone(): Particle {
        const res = new Particle();
        res.id = this.id;
        res.init_peer_id = this.init_peer_id;
        res.timestamp = this.timestamp;
        res.ttl = this.ttl;
        res.script = this.script;
        res.signature = this.signature;
        res.data = this.data;
        res.callResults = this.callResults;
        return res;
    }

    viewData(): string {
        return new TextDecoder().decode(this.data);
    }

    static createNew(script: string, ttlMs?: number): Particle {
        const res = new Particle();
        res.id = genUUID();
        res.script = script;
        res.ttl = ttlMs || DefaultTTL;
        res.data = Buffer.from([]);
        res.timestamp = Date.now();

        return res;
    }

    static fromString(str: string): Particle {
        const json = JSON.parse(str);
        const res = new Particle();
        res.id = json.id;
        res.init_peer_id = json.init_peer_id;
        res.timestamp = json.timestamp;
        res.ttl = json.ttl;
        res.script = json.script;
        res.signature = json.signature;
        res.data = toByteArray(json.data);

        return res;
    }

    toString(): string {
        const particle = this;
        const payload = {
            action: 'Particle',
            id: particle.id,
            init_peer_id: particle.init_peer_id,
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
        switch (level) {
            case 'debug':
                fn = log.debug;
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

        fn(message, {
            id: this.id,
            init_peer_id: this.init_peer_id,
            timestamp: this.timestamp,
            ttl: this.ttl,
            script: this.script,
            signature: this.signature,
            data: dataToString(this.data),
        });
    }
}

export interface ParticleOld {
    id: string;
    init_peer_id: string;
    timestamp: number;
    ttl: number;
    script: string;
    // sign upper fields
    signature: string;
    data: Uint8Array;
}

export const logParticle = (fn: Function, message: string, particle: ParticleOld) => {
    const toLog = { ...particle };
    delete toLog.data;
    fn(message, toLog);
};

/**
 * Represents particle action to send to a node
 */
interface ParticlePayloadOld {
    action: 'Particle';
    id: string;
    init_peer_id: string;
    timestamp: number;
    ttl: number;
    script: string;
    signature: number[];
    data: string;
}

/**
 * Creates an action to send to a node.
 */
export function toPayload(particle: ParticleOld): ParticlePayloadOld {
    return {
        action: 'Particle',
        id: particle.id,
        init_peer_id: particle.init_peer_id,
        timestamp: particle.timestamp,
        ttl: particle.ttl,
        script: particle.script,
        // TODO: copy signature from a particle after signatures will be implemented on nodes
        signature: [],
        data: fromByteArray(particle.data),
    };
}

export function parseParticle(str: string): ParticleOld {
    let json = JSON.parse(str);

    return {
        id: json.id,
        init_peer_id: json.init_peer_id,
        timestamp: json.timestamp,
        ttl: json.ttl,
        script: json.script,
        signature: json.signature,
        data: toByteArray(json.data),
    };
}

export function genUUID() {
    return uuidv4();
}

export function dataToString(data: Uint8Array) {
    return new TextDecoder().decode(Buffer.from(data));
}
