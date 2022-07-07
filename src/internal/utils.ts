/*
 * Copyright 2021 Fluence Labs Limited
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

import log from 'loglevel';
import platform from 'platform';

import { CallServiceData, CallServiceResult, CallServiceResultType, ResultCodes } from './commonTypes';
import { FluencePeer } from './FluencePeer';
import { LogLevel } from '@fluencelabs/avm';
import { ParticleExecutionStage } from './Particle';
import Buffer from './Buffer';

export const MakeServiceCall =
    (fn: (args: any[]) => CallServiceResultType) =>
    (req: CallServiceData): CallServiceResult => ({
        retCode: ResultCodes.success,
        result: fn(req.args),
    });

export const handleTimeout = (fn: () => void) => (stage: ParticleExecutionStage) => {
    if (stage.stage === 'expired') {
        fn();
    }
};
export const doNothing = (..._args: Array<unknown>) => undefined;

/**
 * Checks the network connection by sending a ping-like request to relay node
 * @param { FluenceClient } peer - The Fluence Client instance.
 */
export const checkConnection = async (peer: FluencePeer, ttl?: number): Promise<boolean> => {
    if (!peer.getStatus().isConnected) {
        return false;
    }

    const msg = Math.random().toString(36).substring(7);

    const promise = new Promise<string>((resolve, reject) => {
        const script = `
    (xor
        (seq
            (call %init_peer_id% ("load" "relay") [] init_relay)
            (seq
                (call %init_peer_id% ("load" "msg") [] msg)
                (seq 
                    (call init_relay ("op" "identity") [msg] result)
                    (call %init_peer_id% ("callback" "callback") [result])
                )
            )
        )
        (seq 
            (call init_relay ("op" "identity") [])
            (call %init_peer_id% ("callback" "error") [%last_error%])
        )
    )`;
        const particle = peer.internals.createNewParticle(script, ttl);

        if (particle instanceof Error) {
            return reject(particle.message);
        }

        peer.internals.regHandler.forParticle(
            particle.id,
            'load',
            'relay',
            MakeServiceCall(() => {
                return peer.getStatus().relayPeerId;
            }),
        );

        peer.internals.regHandler.forParticle(
            particle.id,
            'load',
            'msg',
            MakeServiceCall(() => {
                return msg;
            }),
        );

        peer.internals.regHandler.forParticle(
            particle.id,
            'callback',
            'callback',
            MakeServiceCall((args) => {
                const [val] = args;
                setTimeout(() => {
                    resolve(val);
                }, 0);
                return {};
            }),
        );

        peer.internals.regHandler.forParticle(
            particle.id,
            'callback',
            'error',
            MakeServiceCall((args) => {
                const [error] = args;
                setTimeout(() => {
                    reject(error);
                }, 0);
                return {};
            }),
        );

        peer.internals.initiateParticle(
            particle,
            handleTimeout(() => {
                reject('particle timed out');
            }),
        );
    });

    try {
        const result = await promise;
        if (result != msg) {
            log.warn("unexpected behavior. 'identity' must return the passed arguments.");
        }
        return true;
    } catch (e) {
        log.error('Error on establishing connection: ', e);
        return false;
    }
};

export function dataToString(data: Uint8Array) {
    const text = new TextDecoder().decode(Buffer.from(data));
    // try to treat data as json and pretty-print it
    try {
        return JSON.stringify(JSON.parse(text), null, 4);
    } catch {
        return text;
    }
}

export function jsonify(obj: unknown) {
    return JSON.stringify(obj, null, 4);
}

export function throwIfNotSupported() {
    if (platform.name === 'Node.js' && platform.version) {
        const version = platform.version.split('.').map(Number);
        const major = version[0];
        if (major < 16) {
            throw new Error(
                'FluenceJS requires node.js version >= "16.x"; Detected ' +
                    platform.description +
                    ' Please update node.js to version 16 or higher.\nYou can use https://nvm.sh utility to update node.js version: "nvm install 17 && nvm use 17 && nvm alias default 17"',
            );
        }
    }
}

/**
 * Enum representing the log level used in Aqua VM.
 * Possible values: 'info', 'trace', 'debug', 'info', 'warn', 'error', 'off';
 */
export type MarineLoglevel = LogLevel;

export const marineLogLevelToEnvs = (marineLogLevel: MarineLoglevel | undefined) =>
    marineLogLevel ? { WASM_LOG: marineLogLevel } : undefined;
