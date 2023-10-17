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

import { CallResultsArray } from "@fluencelabs/avm";
import { fromUint8Array, toUint8Array } from "js-base64";
import { concat } from "uint8arrays/concat";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { KeyPair } from "../keypair/index.js";
import { numberToLittleEndianBytes } from "../util/bytes.js";

import { IParticle } from "./interfaces.js";

const particleSchema = z.object({
  id: z.string(),
  timestamp: z.number().positive(),
  script: z.string(),
  data: z.string(),
  ttl: z.number().positive(),
  init_peer_id: z.string(),
  signature: z.array(z.number()),
});

export class Particle implements IParticle {
  constructor(
    readonly id: string,
    readonly timestamp: number,
    readonly script: string,
    readonly data: Uint8Array,
    readonly ttl: number,
    readonly initPeerId: string,
    readonly signature: Uint8Array,
  ) {}

  static async createNew(
    script: string,
    initPeerId: string,
    ttl: number,
    keyPair: KeyPair,
    _id?: string,
    _timestamp?: number,
    _data?: Uint8Array,
  ): Promise<Particle> {
    const id = _id ?? uuidv4();
    const timestamp = _timestamp ?? Date.now();
    const data = _data ?? new Uint8Array([]);
    const message = buildParticleMessage({ id, timestamp, ttl, script });
    const signature = await keyPair.signBytes(message);
    return new Particle(
      id,
      timestamp,
      script,
      data,
      ttl,
      initPeerId,
      signature,
    );
  }

  static fromString(str: string): Particle {
    const json = JSON.parse(str);

    const res = particleSchema.safeParse(json);

    if (!res.success) {
      throw new Error(
        `Particle format invalid. Errors: ${JSON.stringify(
          res.error.flatten(),
        )}`,
      );
    }

    const data = res.data;

    return new Particle(
      data.id,
      data.timestamp,
      data.script,
      toUint8Array(data.data),
      data.ttl,
      data.init_peer_id,
      new Uint8Array(data.signature),
    );
  }
}

const en = new TextEncoder();

/**
 * Builds particle message for signing
 */
export const buildParticleMessage = ({
  id,
  timestamp,
  ttl,
  script,
}: Omit<IParticle, "initPeerId" | "signature" | "data">): Uint8Array => {
  return concat([
    en.encode(id),
    numberToLittleEndianBytes(timestamp, "u64"),
    numberToLittleEndianBytes(ttl, "u32"),
    en.encode(script),
  ]);
};

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
 * Creates a particle clone with new data
 */
export const cloneWithNewData = (
  particle: IParticle,
  newData: Uint8Array,
): IParticle => {
  return new Particle(
    particle.id,
    particle.timestamp,
    particle.script,
    newData,
    particle.ttl,
    particle.initPeerId,
    particle.signature,
  );
};

/**
 * Serializes particle into string suitable for sending through network
 */
export const serializeToString = (particle: IParticle): string => {
  return JSON.stringify({
    action: "Particle",
    id: particle.id,
    init_peer_id: particle.initPeerId,
    timestamp: particle.timestamp,
    ttl: particle.ttl,
    script: particle.script,
    signature: Array.from(particle.signature),
    data: fromUint8Array(particle.data),
  });
};

/**
 * When particle is executed, it goes through different stages. The type describes all possible stages and their parameters
 */
export type ParticleExecutionStage =
  | { stage: "received" }
  | { stage: "interpreted" }
  | { stage: "interpreterError"; errorMessage: string }
  | { stage: "localWorkDone" }
  | { stage: "sent" }
  | { stage: "sendingError"; errorMessage: string }
  | { stage: "expired" };

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
export const handleTimeout = (fn: () => void) => {
  return (stage: ParticleExecutionStage) => {
    if (stage.stage === "expired") {
      fn();
    }
  };
};
