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

import { CallServiceResult } from '@fluencelabs/avm-runner-interface';
import { CallParams } from '@fluencelabs/fluence';
import { encode, decode } from 'bs58';
import { PeerIdB58 } from 'src';
import { GenericCallServiceHandler, ResultCodes } from './commonTypes';
import { KeyPair } from './KeyPair';
import { SigDef } from './services/services';

const success = (result: any): CallServiceResult => {
    return {
        result: result,
        retCode: ResultCodes.success,
    };
};

const error = (error: string): CallServiceResult => {
    return {
        result: error,
        retCode: ResultCodes.error,
    };
};

export interface BuiltInServiceContext {
    peerKeyPair: KeyPair;
    peerId: PeerIdB58;
}

export function builtInServices(context: BuiltInServiceContext): {
    [serviceId in string]: { [fnName in string]: GenericCallServiceHandler };
} {
    return {
        op: {
            noop: (req) => {
                return success({});
            },

            array: (req) => {
                return success(req.args);
            },

            identity: (req) => {
                if (req.args.length > 1) {
                    return error(`identity accepts up to 1 arguments, received ${req.args.length} arguments`);
                } else {
                    return success(req.args.length === 0 ? {} : req.args[0]);
                }
            },

            concat: (req) => {
                const incorrectArgIndices = req.args //
                    .map((x, i) => [Array.isArray(x), i])
                    .filter(([isArray, _]) => !isArray)
                    .map(([_, index]) => index);

                if (incorrectArgIndices.length > 0) {
                    const str = incorrectArgIndices.join(', ');
                    return error(`All arguments of 'concat' must be arrays: arguments ${str} are not`);
                } else {
                    return success([].concat.apply([], req.args));
                }
            },

            string_to_b58: (req) => {
                if (req.args.length !== 1) {
                    return error('string_to_b58 accepts only one string argument');
                } else {
                    return success(encode(new TextEncoder().encode(req.args[0])));
                }
            },

            string_from_b58: (req) => {
                if (req.args.length !== 1) {
                    return error('string_from_b58 accepts only one string argument');
                } else {
                    return success(new TextDecoder().decode(decode(req.args[0])));
                }
            },

            bytes_to_b58: (req) => {
                if (req.args.length !== 1 || !Array.isArray(req.args[0])) {
                    return error('bytes_to_b58 accepts only single argument: array of numbers');
                } else {
                    const argumentArray = req.args[0] as number[];
                    return success(encode(new Uint8Array(argumentArray)));
                }
            },

            bytes_from_b58: (req) => {
                if (req.args.length !== 1) {
                    return error('bytes_from_b58 accepts only one string argument');
                } else {
                    return success(Array.from(decode(req.args[0])));
                }
            },
        },

        peer: {
            timeout: (req) => {
                if (req.args.length !== 2) {
                    return error('timeout accepts exactly two arguments: timeout duration in ms and a message string');
                }
                const durationMs = req.args[0];
                const message = req.args[1];

                return new Promise((resolve) => {
                    setTimeout(() => {
                        const res = success(message);
                        resolve(res);
                    }, durationMs);
                });
            },

            identify: (req) => {
                return error('The JS implementation of Peer does not support identify');
            },
        },
    };
}

export class Sig implements SigDef {
    private _keyPair: KeyPair;

    constructor(keyPair: KeyPair) {
        this._keyPair = keyPair;
    }

    allowedServices: string[] = [
        'trust-graph.get_trust_bytes',
        'trust-graph.get_revocation_bytes',
        'registry.get_key_bytes',
        'registry.get_record_bytes',
    ];

    get_pub_key() {
        return this._keyPair.toB58String();
    }

    async sign(data: number[], callParams: CallParams<'data'>): Promise<number[]> {
        const t = callParams.tetraplets.data[0];
        const serviceFnPair = `${t.service_id}.${t.function_name}`;

        if (callParams.initPeerId !== this._keyPair.toB58String()) {
            throw 'sign is only allowed to be called on the same peer the particle was initiated from';
        }

        if (this.allowedServices.indexOf(serviceFnPair) === -1) {
            throw 'Only data from the following services is allowed to be signed: ' + this.allowedServices.join(', ');
        }

        const signedData = await this._keyPair.signBytes(Uint8Array.from(data));
        return Array.from(signedData);
    }

    verify(signature: number[], data: number[]): Promise<boolean> {
        return this._keyPair.verify(Uint8Array.from(data), Uint8Array.from(signature));
    }
}
