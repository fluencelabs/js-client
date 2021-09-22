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
import PeerId from 'peer-id';
import { encode } from 'bs58';
import log, { LogLevel } from 'loglevel';

const DefaultTTL = 7000;

export class Particle {
    id: string;
    init_peer_id: string;
    timestamp: number;
    ttl: number;
    script: string;
    signature: string;
    data: Uint8Array;

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
