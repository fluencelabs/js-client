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

import { atob, fromUint8Array, toUint8Array } from 'js-base64';
import { CallResultsArray } from '@fluencelabs/avm';
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer';
import { IParticle } from './interfaces.js';
import { concat } from 'uint8arrays/concat';
import { numberToLittleEndianBytes } from '../util/bytes.js';
import { KeyPair } from '../keypair/index.js';

export class Particle implements IParticle {
    constructor(
        public readonly id: string,
        public readonly timestamp: number,
        public readonly script: string,
        public readonly data: Uint8Array,
        public readonly ttl: number,
        public readonly initPeerId: string,
        public readonly signature: Uint8Array
    ) {}

    static async createNew(script: string, initPeerId: string, ttl: number, keyPair: KeyPair): Promise<Particle> {
        const id = uuidv4();
        const timestamp = Date.now();
        const message = buildParticleMessage({ id, timestamp, ttl, script });
        const signature = await keyPair.signBytes(message);
        return new Particle(uuidv4(), Date.now(), script, Buffer.from([]), ttl, initPeerId, signature);
    }

    static fromString(str: string): Particle {
        const json = JSON.parse(str);
        const res = new Particle(
            json.id,
            json.timestamp,
            json.script,
            toUint8Array(json.data),
            json.ttl,
            json.init_peer_id,
            toUint8Array(json.signature)
        );

        return res;
    }
}

const en = new TextEncoder();

/**
 * Builds particle message for signing
 */
export const buildParticleMessage = ({ id, timestamp, ttl, script }: Omit<IParticle, 'initPeerId' | 'signature' | 'data'>): Uint8Array => {
    return concat([
        en.encode(id),
        numberToLittleEndianBytes(timestamp, 'u64'),
        numberToLittleEndianBytes(ttl, 'u32'),
        en.encode(script),
    ]);
}

/**
 * Returns actual ttl of a particle, i.e. ttl - time passed since particle creation
 */
export const getActualTTL = (particle: IParticle): number => {
    return particle.timestamp + particle.ttl - Date.now();
};

/**
 * Returns true if particle has expired
 */
export const hasExpired = (particle: IParticle): boolean => {
    return getActualTTL(particle) <= 0;
};

/**
 * Validates that particle signature is correct
 */
export const verifySignature = async (particle: IParticle, keyPair: KeyPair): Promise<boolean> => {
    const message = buildParticleMessage(particle);
    return keyPair.verify(message, particle.signature);
}

/**
 * Creates a particle clone with new data
 */
export const cloneWithNewData = (particle: IParticle, newData: Uint8Array): IParticle => {
    return new Particle(particle.id, particle.timestamp, particle.script, newData, particle.ttl, particle.initPeerId, particle.signature);
};

/**
 * Creates a deep copy of a particle
 */
export const fullClone = (particle: IParticle): IParticle => {
    return JSON.parse(JSON.stringify(particle));
};

/**
 * Serializes particle into string suitable for sending through network
 */
export const serializeToString = (particle: IParticle): string => {
    return JSON.stringify({
        action: 'Particle',
        id: particle.id,
        init_peer_id: particle.initPeerId,
        timestamp: particle.timestamp,
        ttl: particle.ttl,
        script: particle.script,
        signature: particle.signature,
        data: particle.data && fromUint8Array(particle.data),
    });
};

/**
 * When particle is executed, it goes through different stages. The type describes all possible stages and their parameters
 */
export type ParticleExecutionStage =
    | { stage: 'received' }
    | { stage: 'interpreted' }
    | { stage: 'interpreterError'; errorMessage: string }
    | { stage: 'localWorkDone' }
    | { stage: 'sent' }
    | { stage: 'sendingError'; errorMessage: string }
    | { stage: 'expired' };

/**
 * Particle queue item is a wrapper around particle, which contains additional information about particle execution
 */
export interface ParticleQueueItem {
    particle: IParticle;
    callResults: CallResultsArray;
    onStageChange: (state: ParticleExecutionStage) => void;
}

/**
 * Helper function to handle particle at expired stage
 */
export const handleTimeout = (fn: () => void) => (stage: ParticleExecutionStage) => {
    if (stage.stage === 'expired') {
        fn();
    }
};
