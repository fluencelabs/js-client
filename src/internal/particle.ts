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
import { InterpreterOutcome, ParticleHandler } from './commonTypes';

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

    async toDto(peerId: PeerId, customId?: string): Promise<ParticleDto> {
        const id = customId ?? genUUID();
        let currentTime = new Date().getTime();

        let data;
        if (this.data === undefined) {
            data = new Map();
        }

        let ttl;
        if (this.ttl === undefined) {
            ttl = DEFAULT_TTL;
        }

        injectDataIntoParticle(id, data, ttl);
        let script = wrapWithVariableInjectionScript(this.script, Array.from(data.keys()));

        let particle: ParticleDto = {
            id: id,
            init_peer_id: peerId.toB58String(),
            timestamp: currentTime,
            ttl: ttl,
            script: script,
            signature: '',
            data: Buffer.from([]),
        };

        particle.signature = await signParticle(peerId, particle);

        return particle;
    }

    executionHandler: ParticleHandler;
    sendParticleFurther: (particle: ParticleDto) => void;

    onParticleTimeout?: (particle: ParticleDto, now: number) => void;
    onLocalParticleRecieved?: (particle: ParticleDto) => void;
    onExternalParticleRecieved?: (particle: ParticleDto) => void;
    onInterpreterExecuting?: (particle: ParticleDto) => void;
    onInterpreterExecuted?: (interpreterOutcome: InterpreterOutcome) => void;
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

export function canonicalBytes(particle: ParticleDto) {
    let peerIdBuf = Buffer.from(particle.init_peer_id, 'utf8');
    let idBuf = Buffer.from(particle.id, 'utf8');

    let tsArr = new ArrayBuffer(8);
    new DataView(tsArr).setBigUint64(0, BigInt(particle.timestamp));
    let tsBuf = Buffer.from(tsArr);

    let ttlArr = new ArrayBuffer(4);
    new DataView(ttlArr).setUint32(0, particle.ttl);
    let ttlBuf = Buffer.from(ttlArr);

    let scriptBuf = Buffer.from(particle.script, 'utf8');

    return Buffer.concat([peerIdBuf, idBuf, tsBuf, ttlBuf, scriptBuf]);
}

/**
 * Sign a particle with a private key from peerId.
 */
export async function signParticle(peerId: PeerId, particle: ParticleDto): Promise<string> {
    let bufToSign = canonicalBytes(particle);

    let signature = await peerId.privKey.sign(bufToSign);
    return encode(signature);
}

export function genUUID() {
    return uuidv4();
}
