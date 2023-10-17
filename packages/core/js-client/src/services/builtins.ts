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

import assert from "assert";
import { Buffer } from "buffer";

import { JSONValue } from "@fluencelabs/interfaces";
import bs58 from "bs58";
import { sha256 } from "multiformats/hashes/sha2";

import {
  CallServiceResult,
  CallServiceResultType,
  GenericCallServiceHandler,
  ResultCodes,
} from "../jsServiceHost/interfaces.js";
import { getErrorMessage, isString, jsonify } from "../util/utils.js";

const success = (
  // TODO: Remove unknown after adding validation to builtin inputs
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  result: CallServiceResultType | unknown,
): CallServiceResult => {
  return {
    // TODO: Remove type assertion after adding validation to builtin inputs
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    result: result as CallServiceResultType,
    retCode: ResultCodes.success,
  };
};

const error = (
  // TODO: Remove unknown after adding validation to builtin inputs
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  error: CallServiceResultType | unknown,
): CallServiceResult => {
  return {
    // TODO: Remove type assertion after adding validation to builtin inputs
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    result: error as CallServiceResultType,
    retCode: ResultCodes.error,
  };
};

const errorNotImpl = (methodName: string) => {
  return error(
    `The JS implementation of Peer does not support "${methodName}"`,
  );
};

const makeJsonImpl = (args: [Record<string, JSONValue>, ...JSONValue[]]) => {
  const [obj, ...kvs] = args;

  const toMerge: Record<string, JSONValue> = {};

  for (let i = 0; i < kvs.length / 2; i++) {
    const k = kvs[i * 2];

    if (!isString(k)) {
      return error(`Argument ${i * 2 + 1} is expected to be string`);
    }

    const v = kvs[i * 2 + 1];
    toMerge[k] = v;
  }

  const res = { ...obj, ...toMerge };
  return success(res);
};

// TODO: These assert made for silencing more stricter ts rules. Will be fixed in DXJ-493
export const builtInServices: Record<
  string,
  Record<string, GenericCallServiceHandler>
> = {
  peer: {
    identify: () => {
      return success({
        external_addresses: [],
        // TODO: remove hardcoded values
        node_version: "js-0.23.0",
        air_version: "js-0.24.2",
      });
    },

    timestamp_ms: () => {
      return success(Date.now());
    },

    timestamp_sec: () => {
      return success(Math.floor(Date.now() / 1000));
    },

    is_connected: () => {
      return errorNotImpl("peer.is_connected");
    },

    connect: () => {
      return errorNotImpl("peer.connect");
    },

    get_contact: () => {
      return errorNotImpl("peer.get_contact");
    },

    timeout: (req) => {
      if (req.args.length !== 2) {
        return error(
          "timeout accepts exactly two arguments: timeout duration in ms and a message string",
        );
      }

      const durationMs = req.args[0];
      const message = req.args[1];

      if (typeof durationMs !== "number" || typeof message !== "string") {
        return error(
          "timeout accepts exactly two arguments: timeout duration in ms and a message string",
        );
      }

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
      return errorNotImpl("kad.neighborhood");
    },

    merge: () => {
      return errorNotImpl("kad.merge");
    },
  },

  srv: {
    list: () => {
      return errorNotImpl("srv.list");
    },

    create: () => {
      return errorNotImpl("srv.create");
    },

    get_interface: () => {
      return errorNotImpl("srv.get_interface");
    },

    resolve_alias: () => {
      return errorNotImpl("srv.resolve_alias");
    },

    add_alias: () => {
      return errorNotImpl("srv.add_alias");
    },

    remove: () => {
      return errorNotImpl("srv.remove");
    },
  },

  dist: {
    add_module_from_vault: () => {
      return errorNotImpl("dist.add_module_from_vault");
    },

    add_module: () => {
      return errorNotImpl("dist.add_module");
    },

    add_blueprint: () => {
      return errorNotImpl("dist.add_blueprint");
    },

    make_module_config: () => {
      return errorNotImpl("dist.make_module_config");
    },

    load_module_config: () => {
      return errorNotImpl("dist.load_module_config");
    },

    default_module_config: () => {
      return errorNotImpl("dist.default_module_config");
    },

    make_blueprint: () => {
      return errorNotImpl("dist.make_blueprint");
    },

    load_blueprint: () => {
      return errorNotImpl("dist.load_blueprint");
    },

    list_modules: () => {
      return errorNotImpl("dist.list_modules");
    },

    get_module_interface: () => {
      return errorNotImpl("dist.get_module_interface");
    },

    list_blueprints: () => {
      return errorNotImpl("dist.list_blueprints");
    },
  },

  script: {
    add: () => {
      return errorNotImpl("script.add");
    },

    remove: () => {
      return errorNotImpl("script.remove");
    },

    list: () => {
      return errorNotImpl("script.list");
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
        return error(
          "array_length accepts exactly one argument, found: " +
            req.args.length,
        );
      } else {
        assert(Array.isArray(req.args[0]));
        return success(req.args[0].length);
      }
    },

    identity: (req) => {
      if (req.args.length > 1) {
        return error(
          `identity accepts up to 1 arguments, received ${req.args.length} arguments`,
        );
      } else {
        return success(req.args.length === 0 ? {} : req.args[0]);
      }
    },

    concat: (req) => {
      const incorrectArgIndices = req.args //
        .map((x, i): [boolean, number] => {
          return [Array.isArray(x), i];
        })
        .filter(([isArray]) => {
          return !isArray;
        })
        .map(([, index]) => {
          return index;
        });

      if (incorrectArgIndices.length > 0) {
        const str = incorrectArgIndices.join(", ");
        return error(
          `All arguments of 'concat' must be arrays: arguments ${str} are not`,
        );
      } else {
        // TODO: remove after adding validation
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        return success([].concat(...(req.args as never[][])));
      }
    },

    string_to_b58: (req) => {
      if (req.args.length !== 1) {
        return error("string_to_b58 accepts only one string argument");
      } else {
        const [input] = req.args;
        // TODO: remove after adding validation
        assert(typeof input === "string");
        return success(bs58.encode(new TextEncoder().encode(input)));
      }
    },

    string_from_b58: (req) => {
      if (req.args.length !== 1) {
        return error("string_from_b58 accepts only one string argument");
      } else {
        const [input] = req.args;
        // TODO: remove after adding validation
        assert(typeof input === "string");
        return success(new TextDecoder().decode(bs58.decode(input)));
      }
    },

    bytes_to_b58: (req) => {
      if (req.args.length !== 1 || !Array.isArray(req.args[0])) {
        return error(
          "bytes_to_b58 accepts only single argument: array of numbers",
        );
      } else {
        // TODO: remove after adding validation
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const argumentArray = req.args[0] as number[];
        return success(bs58.encode(new Uint8Array(argumentArray)));
      }
    },

    bytes_from_b58: (req) => {
      if (req.args.length !== 1) {
        return error("bytes_from_b58 accepts only one string argument");
      } else {
        const [input] = req.args;
        // TODO: remove after adding validation
        assert(typeof input === "string");
        return success(Array.from(bs58.decode(input)));
      }
    },

    sha256_string: async (req) => {
      if (req.args.length !== 1) {
        return error(
          `sha256_string accepts 1 argument, found: ${req.args.length}`,
        );
      } else {
        const [input] = req.args;
        // TODO: remove after adding validation
        assert(typeof input === "string");
        const inBuffer = Buffer.from(input);
        const multihash = await sha256.digest(inBuffer);

        return success(bs58.encode(multihash.bytes));
      }
    },

    concat_strings: (req) => {
      // TODO: remove after adding validation
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const res = "".concat(...(req.args as string[]));
      return success(res);
    },
  },

  debug: {
    stringify: (req) => {
      let out;

      if (req.args.length === 0) {
        out = "<empty argument list>";
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

      if ((err = checkForArgumentsCount(req, 2)) != null) {
        return err;
      }

      const [x, y] = req.args;
      // TODO: Remove after adding validation
      assert(typeof x === "number" && typeof y === "number");
      return success(x + y);
    },

    sub: (req) => {
      let err;

      if ((err = checkForArgumentsCount(req, 2)) != null) {
        return err;
      }

      const [x, y] = req.args;
      // TODO: Remove after adding validation
      assert(typeof x === "number" && typeof y === "number");
      return success(x - y);
    },

    mul: (req) => {
      let err;

      if ((err = checkForArgumentsCount(req, 2)) != null) {
        return err;
      }

      const [x, y] = req.args;
      // TODO: Remove after adding validation
      assert(typeof x === "number" && typeof y === "number");
      return success(x * y);
    },

    fmul: (req) => {
      let err;

      if ((err = checkForArgumentsCount(req, 2)) != null) {
        return err;
      }

      const [x, y] = req.args;
      // TODO: Remove after adding validation
      assert(typeof x === "number" && typeof y === "number");
      return success(Math.floor(x * y));
    },

    div: (req) => {
      let err;

      if ((err = checkForArgumentsCount(req, 2)) != null) {
        return err;
      }

      const [x, y] = req.args;
      // TODO: Remove after adding validation
      assert(typeof x === "number" && typeof y === "number");
      return success(Math.floor(x / y));
    },

    rem: (req) => {
      let err;

      if ((err = checkForArgumentsCount(req, 2)) != null) {
        return err;
      }

      const [x, y] = req.args;
      // TODO: Remove after adding validation
      assert(typeof x === "number" && typeof y === "number");
      return success(x % y);
    },

    pow: (req) => {
      let err;

      if ((err = checkForArgumentsCount(req, 2)) != null) {
        return err;
      }

      const [x, y] = req.args;
      // TODO: Remove after adding validation
      assert(typeof x === "number" && typeof y === "number");
      return success(Math.pow(x, y));
    },

    log: (req) => {
      let err;

      if ((err = checkForArgumentsCount(req, 2)) != null) {
        return err;
      }

      const [x, y] = req.args;
      // TODO: Remove after adding validation
      assert(typeof x === "number" && typeof y === "number");
      return success(Math.log(y) / Math.log(x));
    },
  },

  cmp: {
    gt: (req) => {
      let err;

      if ((err = checkForArgumentsCount(req, 2)) != null) {
        return err;
      }

      const [x, y] = req.args;
      // TODO: Remove after adding validation
      assert(typeof x === "number" && typeof y === "number");
      return success(x > y);
    },

    gte: (req) => {
      let err;

      if ((err = checkForArgumentsCount(req, 2)) != null) {
        return err;
      }

      const [x, y] = req.args;
      // TODO: Remove after adding validation
      assert(typeof x === "number" && typeof y === "number");
      return success(x >= y);
    },

    lt: (req) => {
      let err;

      if ((err = checkForArgumentsCount(req, 2)) != null) {
        return err;
      }

      const [x, y] = req.args;
      // TODO: Remove after adding validation
      assert(typeof x === "number" && typeof y === "number");
      return success(x < y);
    },

    lte: (req) => {
      let err;

      if ((err = checkForArgumentsCount(req, 2)) != null) {
        return err;
      }

      const [x, y] = req.args;
      // TODO: Remove after adding validation
      assert(typeof x === "number" && typeof y === "number");
      return success(x <= y);
    },

    cmp: (req) => {
      let err;

      if ((err = checkForArgumentsCount(req, 2)) != null) {
        return err;
      }

      const [x, y] = req.args;
      // TODO: Remove after adding validation
      assert(typeof x === "number" && typeof y === "number");
      return success(x === y ? 0 : x > y ? 1 : -1);
    },
  },

  array: {
    sum: (req) => {
      let err;

      if ((err = checkForArgumentsCount(req, 1)) != null) {
        return err;
      }

      // TODO: Remove after adding validation
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const [xs] = req.args as [number[]];
      return success(
        xs.reduce((agg, cur) => {
          return agg + cur;
        }, 0),
      );
    },

    dedup: (req) => {
      let err;

      if ((err = checkForArgumentsCount(req, 1)) != null) {
        return err;
      }

      const [xs] = req.args;
      // TODO: Remove after adding validation
      assert(Array.isArray(xs));
      const set = new Set(xs);
      return success(Array.from(set));
    },

    intersect: (req) => {
      let err;

      if ((err = checkForArgumentsCount(req, 2)) != null) {
        return err;
      }

      const [xs, ys] = req.args;
      // TODO: Remove after adding validation
      assert(Array.isArray(xs) && Array.isArray(ys));

      const intersection = xs.filter((x) => {
        return ys.includes(x);
      });

      return success(intersection);
    },

    diff: (req) => {
      let err;

      if ((err = checkForArgumentsCount(req, 2)) != null) {
        return err;
      }

      const [xs, ys] = req.args;
      // TODO: Remove after adding validation
      assert(Array.isArray(xs) && Array.isArray(ys));

      const diff = xs.filter((x) => {
        return !ys.includes(x);
      });

      return success(diff);
    },

    sdiff: (req) => {
      let err;

      if ((err = checkForArgumentsCount(req, 2)) != null) {
        return err;
      }

      const [xs, ys] = req.args;
      // TODO: Remove after adding validation
      assert(Array.isArray(xs) && Array.isArray(ys));

      const sdiff = [
        // force new line
        ...xs.filter((y) => {
          return !ys.includes(y);
        }),
        ...ys.filter((x) => {
          return !xs.includes(x);
        }),
      ];

      return success(sdiff);
    },
  },

  json: {
    obj: (req) => {
      let err;

      if ((err = checkForArgumentsCountEven(req)) != null) {
        return err;
      }

      // TODO: remove after adding validation
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return makeJsonImpl([{}, ...req.args] as [
        Record<string, JSONValue>,
        ...JSONValue[],
      ]);
    },

    put: (req) => {
      let err;

      if ((err = checkForArgumentsCount(req, 3)) != null) {
        return err;
      }

      if ((err = checkForArgumentType(req, 0, "object")) != null) {
        return err;
      }

      return makeJsonImpl(
        // TODO: remove after adding validation
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        req.args as [Record<string, JSONValue>, ...JSONValue[]],
      );
    },

    puts: (req) => {
      let err;

      if ((err = checkForArgumentsCountOdd(req)) != null) {
        return err;
      }

      if ((err = checkForArgumentsCountMoreThan(req, 3)) != null) {
        return err;
      }

      if ((err = checkForArgumentType(req, 0, "object")) != null) {
        return err;
      }

      return makeJsonImpl(
        // TODO: remove after adding validation
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        req.args as [Record<string, JSONValue>, ...JSONValue[]],
      );
    },

    stringify: (req) => {
      let err;

      if ((err = checkForArgumentsCount(req, 1)) != null) {
        return err;
      }

      if ((err = checkForArgumentType(req, 0, "object")) != null) {
        return err;
      }

      const [json] = req.args;
      const res = JSON.stringify(json);
      return success(res);
    },

    parse: (req) => {
      let err;

      if ((err = checkForArgumentsCount(req, 1)) != null) {
        return err;
      }

      if ((err = checkForArgumentType(req, 0, "string")) != null) {
        return err;
      }

      const [raw] = req.args;

      try {
        // TODO: Remove after adding validation
        assert(typeof raw === "string");
        const json = JSON.parse(raw);
        return success(json);
      } catch (err: unknown) {
        return error(getErrorMessage(err));
      }
    },
  },

  "run-console": {
    print: (req) => {
      // This log is intentional
      // eslint-disable-next-line no-console
      console.log(...req.args);
      return success({});
    },
  },
} as const;

const checkForArgumentsCount = (
  req: { args: Array<unknown> },
  count: number,
) => {
  if (req.args.length !== count) {
    return error(`Expected ${count} argument(s). Got ${req.args.length}`);
  }

  return null;
};

const checkForArgumentsCountMoreThan = (
  req: { args: Array<unknown> },
  count: number,
) => {
  if (req.args.length < count) {
    return error(
      `Expected more than ${count} argument(s). Got ${req.args.length}`,
    );
  }

  return null;
};

const checkForArgumentsCountEven = (req: { args: Array<unknown> }) => {
  if (req.args.length % 2 === 1) {
    return error(`Expected even number of argument(s). Got ${req.args.length}`);
  }

  return null;
};

const checkForArgumentsCountOdd = (req: { args: Array<unknown> }) => {
  if (req.args.length % 2 === 0) {
    return error(`Expected odd number of argument(s). Got ${req.args.length}`);
  }

  return null;
};

const checkForArgumentType = (
  req: { args: Array<unknown> },
  index: number,
  type: string,
) => {
  const actual = typeof req.args[index];

  if (actual !== type) {
    return error(
      `Argument ${index} expected to be of type ${type}, Got ${actual}`,
    );
  }

  return null;
};
