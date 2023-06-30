/*
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
import { ClientPeer } from './ClientPeer.js';

import { logger } from '../util/logger.js';
import { WrapFnIntoServiceCall } from '../jsServiceHost/serviceUtils.js';
import { handleTimeout } from '../particle/Particle.js';

const log = logger('connection');

/**
 * Checks the network connection by sending a ping-like request to relay node
 * @param { ClientPeer } peer - The Fluence Client instance.
 */
export const checkConnection = async (peer: ClientPeer, ttl?: number): Promise<boolean> => {
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
            WrapFnIntoServiceCall(() => {
                return peer.getRelayPeerId();
            }),
        );

        peer.internals.regHandler.forParticle(
            particle.id,
            'load',
            'msg',
            WrapFnIntoServiceCall(() => {
                return msg;
            }),
        );

        peer.internals.regHandler.forParticle(
            particle.id,
            'callback',
            'callback',
            WrapFnIntoServiceCall((args) => {
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
            WrapFnIntoServiceCall((args) => {
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
            log.error("unexpected behavior. 'identity' must return the passed arguments.");
        }
        return true;
    } catch (e) {
        log.error('error on establishing connection. Relay: %s error: %j', peer.getRelayPeerId(), e);
        return false;
    }
};
