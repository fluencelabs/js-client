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

import { encode, decode } from 'bs58';
import { sha256 } from 'multiformats/hashes/sha2';
import { CallServiceResult } from '@fluencelabs/avm';

import { GenericCallServiceHandler, ResultCodes } from '../commonTypes';
import { jsonify } from '../utils';
import Buffer from '../Buffer';

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

const errorNotImpl = (methodName: string) => {
    return error(`The JS implementation of Peer does not support "${methodName}"`);
};

export const builtInServices: Record<string, Record<string, GenericCallServiceHandler>> = {
    peer: {
        identify: () => {
            return success({
                external_addresses: [],
                // TODO: remove hardcoded values
                node_version: 'js-0.23.0',
                air_version: 'js-0.24.2',
            });
        },

        timestamp_ms: () => {
            return success(Date.now());
        },

        timestamp_sec: () => {
            return success(Math.floor(Date.now() / 1000));
        },

        is_connected: () => {
            return errorNotImpl('peer.is_connected');
        },

        connect: () => {
            return errorNotImpl('peer.connect');
        },

        get_contact: () => {
            return errorNotImpl('peer.get_contact');
        },

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
    },

    kad: {
        neighborhood: () => {
            return errorNotImpl('kad.neighborhood');
        },

        merge: () => {
            return errorNotImpl('kad.merge');
        },
    },

    srv: {
        list: () => {
            return errorNotImpl('srv.list');
        },

        create: () => {
            return errorNotImpl('srv.create');
        },

        get_interface: () => {
            return errorNotImpl('srv.get_interface');
        },

        resolve_alias: () => {
            return errorNotImpl('srv.resolve_alias');
        },

        add_alias: () => {
            return errorNotImpl('srv.add_alias');
        },

        remove: () => {
            return errorNotImpl('srv.remove');
        },
    },

    dist: {
        add_module_from_vault: () => {
            return errorNotImpl('dist.add_module_from_vault');
        },

        add_module: () => {
            return errorNotImpl('dist.add_module');
        },

        add_blueprint: () => {
            return errorNotImpl('dist.add_blueprint');
        },

        make_module_config: () => {
            return errorNotImpl('dist.make_module_config');
        },

        load_module_config: () => {
            return errorNotImpl('dist.load_module_config');
        },

        default_module_config: () => {
            return errorNotImpl('dist.default_module_config');
        },

        make_blueprint: () => {
            return errorNotImpl('dist.make_blueprint');
        },

        load_blueprint: () => {
            return errorNotImpl('dist.load_blueprint');
        },

        list_modules: () => {
            return errorNotImpl('dist.list_modules');
        },

        get_module_interface: () => {
            return errorNotImpl('dist.get_module_interface');
        },

        list_blueprints: () => {
            return errorNotImpl('dist.list_blueprints');
        },
    },

    script: {
        add: () => {
            return errorNotImpl('script.add');
        },

        remove: () => {
            return errorNotImpl('script.remove');
        },

        list: () => {
            return errorNotImpl('script.list');
        },
    },

    op: {
        noop: () => {
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

        sha256_string: async (req) => {
            if (req.args.length < 1 || req.args.length > 3) {
                return error(`sha256_string accepts 1-3 arguments, found: ${req.args.length}`);
            } else {
                const [input, digestOnly, asBytes] = req.args;
                const inBuffer = Buffer.from(input);
                const multihash = await sha256.digest(inBuffer);

                const outBytes = digestOnly ? multihash.digest : multihash.bytes;
                const res = asBytes ? Array.from(outBytes) : encode(outBytes);

                return success(res);
            }
        },

        concat_strings: (req) => {
            const res = ''.concat(...req.args);
            return success(res);
        },
    },

    debug: {
        stringify: (req) => {
            let out;

            if (req.args.length === 0) {
                out = '<empty argument list>';
            } else if (req.args.length === 1) {
                out = req.args[0];
            } else {
                out = req.args;
            }

            return success(jsonify(out));
        },
    },

    math: {
        add: (req) => {
            let err;
            if ((err = checkForArgumentsCount(req, 2))) {
                return err;
            }
            const [x, y] = req.args;
            return success(x + y);
        },

        sub: (req) => {
            let err;
            if ((err = checkForArgumentsCount(req, 2))) {
                return err;
            }
            const [x, y] = req.args;
            return success(x - y);
        },

        mul: (req) => {
            let err;
            if ((err = checkForArgumentsCount(req, 2))) {
                return err;
            }
            const [x, y] = req.args;
            return success(x * y);
        },

        fmul: (req) => {
            let err;
            if ((err = checkForArgumentsCount(req, 2))) {
                return err;
            }
            const [x, y] = req.args;
            return success(Math.floor(x * y));
        },

        div: (req) => {
            let err;
            if ((err = checkForArgumentsCount(req, 2))) {
                return err;
            }
            const [x, y] = req.args;
            return success(Math.floor(x / y));
        },

        rem: (req) => {
            let err;
            if ((err = checkForArgumentsCount(req, 2))) {
                return err;
            }
            const [x, y] = req.args;
            return success(x % y);
        },

        pow: (req) => {
            let err;
            if ((err = checkForArgumentsCount(req, 2))) {
                return err;
            }
            const [x, y] = req.args;
            return success(Math.pow(x, y));
        },

        log: (req) => {
            let err;
            if ((err = checkForArgumentsCount(req, 2))) {
                return err;
            }
            const [x, y] = req.args;
            return success(Math.log(y) / Math.log(x));
        },
    },

    cmp: {
        gt: (req) => {
            let err;
            if ((err = checkForArgumentsCount(req, 2))) {
                return err;
            }
            const [x, y] = req.args;
            return success(x > y);
        },

        gte: (req) => {
            let err;
            if ((err = checkForArgumentsCount(req, 2))) {
                return err;
            }
            const [x, y] = req.args;
            return success(x >= y);
        },

        lt: (req) => {
            let err;
            if ((err = checkForArgumentsCount(req, 2))) {
                return err;
            }
            const [x, y] = req.args;
            return success(x < y);
        },

        lte: (req) => {
            let err;
            if ((err = checkForArgumentsCount(req, 2))) {
                return err;
            }
            const [x, y] = req.args;
            return success(x <= y);
        },

        cmp: (req) => {
            let err;
            if ((err = checkForArgumentsCount(req, 2))) {
                return err;
            }
            const [x, y] = req.args;
            return success(x === y ? 0 : x > y ? 1 : -1);
        },
    },

    array: {
        sum: (req) => {
            let err;
            if ((err = checkForArgumentsCount(req, 1))) {
                return err;
            }
            const [xs] = req.args;
            return success(xs.reduce((agg: any, cur: any) => agg + cur, 0));
        },

        dedup: (req) => {
            let err;
            if ((err = checkForArgumentsCount(req, 1))) {
                return err;
            }
            const [xs] = req.args;
            const set = new Set(xs);
            return success(Array.from(set));
        },

        intersect: (req) => {
            let err;
            if ((err = checkForArgumentsCount(req, 2))) {
                return err;
            }
            const [xs, ys] = req.args;
            const intersection = xs.filter((x: any) => ys.includes(x));
            return success(intersection);
        },

        diff: (req) => {
            let err;
            if ((err = checkForArgumentsCount(req, 2))) {
                return err;
            }
            const [xs, ys] = req.args;
            const diff = xs.filter((x: unknown) => !ys.includes(x));
            return success(diff);
        },

        sdiff: (req) => {
            let err;
            if ((err = checkForArgumentsCount(req, 2))) {
                return err;
            }
            const [xs, ys] = req.args;
            const sdiff = [
                // force new line
                ...xs.filter((y: unknown) => !ys.includes(y)),
                ...ys.filter((x: unknown) => !xs.includes(x)),
            ];
            return success(sdiff);
        },
    },
} as const;

const checkForArgumentsCount = (req: { args: Array<unknown> }, count: number) => {
    if (req.args.length !== count) {
        return error(`Expected ${count} argument(s). Got ${req.args.length}`);
    }
};
