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

import { AirInterpreter, LogLevel as AvmLogLevel } from '@fluencelabs/avm';
import log from 'loglevel';
import { CallServiceData, CallServiceResult, CallServiceResultType, ResultCodes } from './commonTypes';
import { AvmLoglevel, FluencePeer } from './FluencePeer';
import { Particle, ParticleExecutionStage } from './Particle';

export const createInterpreter = (logLevel: AvmLoglevel): Promise<AirInterpreter> => {
    const logFn = (level: AvmLogLevel, msg: string) => {
        switch (level) {
            case 'error':
                log.error(msg);
                break;

            case 'warn':
                log.warn(msg);
                break;

            case 'info':
                log.info(msg);
                break;

            case 'debug':
            case 'trace':
                log.log(msg);
                break;
        }
    };
    return AirInterpreter.create(logLevel, logFn);
};

export const MakeServiceCall = (fn: (args: any[]) => CallServiceResultType) => {
    return (req: CallServiceData): CallServiceResult => {
        return {
            retCode: ResultCodes.success,
            result: fn(req.args),
        };
    };
};

export const handleTimeout = (fn: Function) => (stage: ParticleExecutionStage) => {
    if (stage.stage === 'expired') {
        fn();
    }
};

export const doNothing = (stage: ParticleExecutionStage) => {};

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
        const particle = Particle.createNew(script, ttl);
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
    return new TextDecoder().decode(Buffer.from(data));
}
