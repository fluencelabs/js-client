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

import { CallServiceResult } from '@fluencelabs/avm';
import { encode, decode } from 'bs58';
import { FluencePeer } from 'src';
import { GenericCallServiceHandler, ResultCodes } from './CallServiceHandler';

const registerHandlersHelper = (
    peer: FluencePeer,
    handlers: { [serviceId in string]: { [fnName in string]: GenericCallServiceHandler } },
) => {
    for (let serviceId in handlers) {
        for (let fnName in handlers[serviceId]) {
            const h = handlers[serviceId][fnName];
            peer.internals.regHandler.common(serviceId, fnName, h);
        }
    }
};

const success = (result: any): CallServiceResult => {
    return {
        result: result,
        retCode: ResultCodes.success,
    };
};

const error = (error: string): CallServiceResult => {
    return {
        result: error,
        retCode: ResultCodes.unknownError,
    };
};

const defaultServices: { [serviceId in string]: { [fnName in string]: GenericCallServiceHandler } } = {
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
};

export const registerDefaultServices = (peer: FluencePeer) => {
    registerHandlersHelper(peer, defaultServices);
};
