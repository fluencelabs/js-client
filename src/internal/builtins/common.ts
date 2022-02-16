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
import { encode, decode } from 'bs58';
import { sha256 } from 'js-sha256';
import { ResultCodes } from '../commonTypes';

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

export const builtInServices = {
    op: {
        noop: (req) => {
            return success({});
        },

        array: (req) => {
            return success(req.args);
        },

        array_length: (req) => {
            if (req.args.length !== 1) {
                return error('array_length accepts exactly one argument, found: ' + req.args.length);
            } else {
                return success(req.args[0].length);
            }
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

        sha256_string: (req) => {
            if (req.args.length !== 1) {
                return error('array_length accepts exactly one argument, found: ' + req.args.length);
            } else {
                const hash = sha256.create();
                hash.update(req.args[0]);
                const buf = hash.arrayBuffer();
                return success(encode(buf));
            }
        },

        concat_strings: (req) => {
            const res = ''.concat(...req.args);
            return success(res);
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
