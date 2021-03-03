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
import { injectDataIntoParticle } from './ParticleProcessor';
import { PeerIdB58 } from './commonTypes';

const DEFAULT_TTL = 7000;

/**
 * The class representing Particle - a data structure used to perform operations on Fluence Network. It originates on some peer in the network, travels the network through a predefined path, triggering function execution along its way.
 */
export class Particle {
    script: string;
    data: Map<string, any>;
    ttl: number;

    /**
     * Creates a particle with specified parameters.
     * @param { String }script - Air script which defines the execution of a particle – its path, functions it triggers on peers, and so on.
     * @param { Map<string, any> | Record<string, any> } data - Variables passed to the particle in the form of either JS Map or JS object with keys representing variable names and values representing values correspondingly
     * @param { [Number]=7000 } ttl - Time to live, a timout after which the particle execution is stopped by Aquamarine.
     */
    constructor(script: string, data?: Map<string, any> | Record<string, any>, ttl?: number) {
        this.script = script;
        if (data === undefined) {
            this.data = new Map();
        } else if (data instanceof Map) {
            this.data = data;
        } else {
            this.data = new Map();
            for (let k in data) {
                this.data.set(k, data[k]);
            }
        }

        this.ttl = ttl ?? DEFAULT_TTL;
    }
}

export interface ParticleDto {
    id: string;
    init_peer_id: string;
    timestamp: number;
    ttl: number;
    script: string;
    // sign upper fields
    signature: string;
    data: Uint8Array;
}

/**
 * Represents particle action to send to a node
 */
interface ParticlePayload {
    action: 'Particle';
    id: string;
    init_peer_id: string;
    timestamp: number;
    ttl: number;
    script: string;
    signature: number[];
    data: string;
}

function wrapWithVariableInjectionScript(script: string, fields: string[]): string {
    fields.forEach((v) => {
        script = `
(seq
    (call %init_peer_id% ("__magic" "load") ["${v}"] ${v})
    ${script}
)
                 `;
    });

    return script;
}

function wrapWithXor(script: string): string {
    return `
    (xor
        ${script}
        (seq
            (call __magic_relay ("op" "identity") [])
            (call %init_peer_id% ("__magic" "handle_xor") [%last_error%])
        )
    )`;
}

function wrapWithXorLocal(script: string): string {
    return `
    (xor
        ${script}
        (call %init_peer_id% ("__magic" "handle_xor") [%last_error%])
    )`;
}

export async function build(
    peerId: PeerId,
    relay: PeerIdB58 | undefined,
    script: string,
    data?: Map<string, any>,
    ttl?: number,
    customId?: string,
): Promise<ParticleDto> {
    const id = customId ?? genUUID();
    let currentTime = new Date().getTime();

    if (data === undefined) {
        data = new Map();
    }

    if (ttl === undefined) {
        ttl = DEFAULT_TTL;
    }

    if (relay) {
        data.set('__magic_relay', relay);
    }
    injectDataIntoParticle(id, data, ttl);
    script = wrapWithVariableInjectionScript(script, Array.from(data.keys()));
    if (relay) {
        script = wrapWithXor(script);
    } else {
        script = wrapWithXorLocal(script);
    }

    let particle: ParticleDto = {
        id: id,
        init_peer_id: peerId.toB58String(),
        timestamp: currentTime,
        ttl: ttl,
        script: script,
        // TODO: sign particle
        signature: '',
        data: Buffer.from([]),
    };

    return particle;
}

/**
 * Creates an action to send to a node.
 */
export function toPayload(particle: ParticleDto): ParticlePayload {
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

export function parseParticle(str: string): ParticleDto {
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
