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

import { JSONValue } from "@fluencelabs/interfaces";
import bs58 from "bs58";
import { sha256 } from "multiformats/hashes/sha2";
import { z } from "zod";

import {
  CallServiceData,
  CallServiceResult,
  CallServiceResultType,
  GenericCallServiceHandler,
  ResultCodes,
} from "../jsServiceHost/interfaces.js";
import { getErrorMessage, jsonify } from "../util/utils.js";

const success = (result: CallServiceResultType): CallServiceResult => {
  return {
    result,
    retCode: ResultCodes.success,
  };
};

const error = (error: CallServiceResultType): CallServiceResult => {
  return {
    result: error,
    retCode: ResultCodes.error,
  };
};

const chunk = <T>(arr: T[]): T[][] => {
  const res: T[][] = [];
  const chunkSize = 2;

  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    res.push(chunk);
  }

  return res;
};

const errorNotImpl = (methodName: string) => {
  return error(
    `The JS implementation of Peer does not support "${methodName}"`,
  );
};

const parseWithSchema = <T extends z.ZodTypeAny>(
  schema: T,
  req: CallServiceData,
): [z.infer<T>, null] | [null, string] => {
  const result = schema.safeParse(req.args, {
    errorMap: (issue, ctx) => {
      if (
        issue.code === z.ZodIssueCode.invalid_type &&
        issue.path.length === 1 &&
        typeof issue.path[0] === "number"
      ) {
        const [arg] = issue.path;
        return {
          message: `Argument ${arg} expected to be of type ${issue.expected}, Got ${issue.received}`,
        };
      }

      if (issue.code === z.ZodIssueCode.too_big) {
        return {
          message: `Expected ${
            issue.maximum
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          } argument(s). Got ${ctx.data.length}`,
        };
      }

      if (issue.code === z.ZodIssueCode.too_small) {
        return {
          message: `Expected ${
            issue.minimum
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          } argument(s). Got ${ctx.data.length}`,
        };
      }

      if (issue.code === z.ZodIssueCode.invalid_union) {
        return {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          message: `Expected argument(s). Got ${ctx.data.length}`,
        };
      }

      return { message: ctx.defaultError };
    },
  });

  if (result.success) {
    return [result.data, null];
  } else {
    return [null, result.error.errors[0]?.message ?? "Unknown error"];
  }
};

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];

const jsonSchema: z.ZodType<Json> = z.lazy(() => {
  return z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]);
});

const jsonImplSchema = z
  .tuple([z.record(jsonSchema)])
  .rest(z.tuple([z.string(), jsonSchema]));

const makeJsonImpl = (args: z.infer<typeof jsonImplSchema>) => {
  const [obj, ...kvs] = args;
  return success({ ...obj, ...Object.fromEntries(kvs) });
};

type withSchema = <T extends z.ZodTypeAny>(
  arg: T,
) => (
  arg1: (value: z.infer<T>) => CallServiceResult | Promise<CallServiceResult>,
) => (req: CallServiceData) => CallServiceResult | Promise<CallServiceResult>;

const withSchema: withSchema = <T extends z.ZodTypeAny>(schema: T) => {
  return (bound) => {
    return (req) => {
      const [value, message] = parseWithSchema(schema, req);

      if (message !== null) {
        return error(message);
      }

      return bound(value);
    };
  };
};

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

    timeout: withSchema(z.tuple([z.number(), z.string()]))(
      ([durationMs, msg]) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            const res = success(msg);
            resolve(res);
          }, durationMs);
        });
      },
    ),
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

    array_length: withSchema(z.tuple([z.array(z.unknown())]))(([arr]) => {
      return success(arr.length);
    }),

    identity: withSchema(z.array(jsonSchema).max(1))((args) => {
      return success("0" in args ? args[0] : {});
    }),

    concat: withSchema(z.array(z.array(z.any())))((args) => {
      return success(args.flat());
    }),

    string_to_b58: withSchema(z.tuple([z.string()]))(([input]) => {
      return success(bs58.encode(new TextEncoder().encode(input)));
    }),

    string_from_b58: withSchema(z.tuple([z.string()]))(([input]) => {
      return success(new TextDecoder().decode(bs58.decode(input)));
    }),

    bytes_to_b58: withSchema(z.tuple([z.array(z.number())]))(([input]) => {
      return success(bs58.encode(new Uint8Array(input)));
    }),

    bytes_from_b58: withSchema(z.tuple([z.string()]))(([input]) => {
      return success(Array.from(bs58.decode(input)));
    }),

    sha256_string: withSchema(z.tuple([z.string()]))(async ([input]) => {
      const inBuffer = new TextEncoder().encode(input);
      const multihash = await sha256.digest(inBuffer);

      return success(bs58.encode(multihash.bytes));
    }),

    concat_strings: withSchema(z.array(z.string()))((args) => {
      return success(args.join(""));
    }),
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
    add: withSchema(z.tuple([z.number(), z.number()]))(([x, y]) => {
      return success(x + y);
    }),

    sub: withSchema(z.tuple([z.number(), z.number()]))(([x, y]) => {
      return success(x - y);
    }),

    mul: withSchema(z.tuple([z.number(), z.number()]))(([x, y]) => {
      return success(x * y);
    }),

    fmul: withSchema(z.tuple([z.number(), z.number()]))(([x, y]) => {
      return success(Math.floor(x * y));
    }),

    div: withSchema(z.tuple([z.number(), z.number()]))(([x, y]) => {
      return success(Math.floor(x / y));
    }),

    rem: withSchema(z.tuple([z.number(), z.number()]))(([x, y]) => {
      return success(x % y);
    }),

    pow: withSchema(z.tuple([z.number(), z.number()]))(([x, y]) => {
      return success(Math.pow(x, y));
    }),

    log: withSchema(z.tuple([z.number(), z.number()]))(([x, y]) => {
      return success(Math.log(y) / Math.log(x));
    }),
  },

  cmp: {
    gt: withSchema(z.tuple([z.number(), z.number()]))(([x, y]) => {
      return success(x > y);
    }),

    gte: withSchema(z.tuple([z.number(), z.number()]))(([x, y]) => {
      return success(x >= y);
    }),

    lt: withSchema(z.tuple([z.number(), z.number()]))(([x, y]) => {
      return success(x < y);
    }),

    lte: withSchema(z.tuple([z.number(), z.number()]))(([x, y]) => {
      return success(x <= y);
    }),

    cmp: withSchema(z.tuple([z.number(), z.number()]))(([x, y]) => {
      return success(x === y ? 0 : x > y ? 1 : -1);
    }),
  },

  array: {
    sum: withSchema(z.tuple([z.array(z.number())]))(([xs]) => {
      return success(
        xs.reduce((agg, cur) => {
          return agg + cur;
        }, 0),
      );
    }),

    dedup: withSchema(z.tuple([z.array(z.any())]))(([xs]) => {
      const set = new Set(xs);
      return success(Array.from(set));
    }),

    intersect: withSchema(z.tuple([z.array(z.any()), z.array(z.any())]))(
      ([xs, ys]) => {
        const intersection = xs.filter((x) => {
          return ys.includes(x);
        });

        return success(intersection);
      },
    ),

    diff: withSchema(z.tuple([z.array(z.any()), z.array(z.any())]))(
      ([xs, ys]) => {
        const diff = xs.filter((x) => {
          return !ys.includes(x);
        });

        return success(diff);
      },
    ),

    sdiff: withSchema(z.tuple([z.array(z.any()), z.array(z.any())]))(
      ([xs, ys]) => {
        const sdiff = [
          xs.filter((y) => {
            return !ys.includes(y);
          }),
          ys.filter((x) => {
            return !xs.includes(x);
          }),
        ].flat();

        return success(sdiff);
      },
    ),
  },

  json: {
    obj: withSchema(
      z
        .array(z.unknown())
        .refine(
          (arr) => {
            return arr.length % 2 === 0;
          },
          (arr) => {
            return {
              message: "Expected even number of argument(s). Got " + arr.length,
            };
          },
        )
        .transform((args) => {
          return chunk(args);
        })
        .pipe(z.array(z.tuple([z.string(), jsonSchema]))),
    )((args) => {
      return makeJsonImpl([{}, ...args]);
    }),

    put: withSchema(
      z
        .tuple([z.record(jsonSchema), z.string(), jsonSchema])
        .transform(
          ([obj, name, value]): [{ [key: string]: Json }, [string, Json]] => {
            return [obj, [name, value]];
          },
        ),
    )(makeJsonImpl),

    puts: withSchema(
      z
        .array(z.unknown())
        .refine(
          (arr) => {
            return arr.length >= 3;
          },
          (value) => {
            return {
              message: `Expected more than 3 argument(s). Got ${value.length}`,
            };
          },
        )
        .refine(
          (arr) => {
            return arr.length % 2 === 1;
          },
          {
            message: "Argument count must be odd.",
          },
        )
        .transform((args) => {
          return [args[0], ...chunk(args.slice(1))];
        })
        .pipe(jsonImplSchema),
    )(makeJsonImpl),

    stringify: withSchema(z.tuple([z.record(z.string(), jsonSchema)]))(
      ([json]) => {
        const res = JSON.stringify(json);
        return success(res);
      },
    ),

    parse: withSchema(z.tuple([z.string()]))(([raw]) => {
      try {
        // Parsing any argument here yields JSONValue
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const json = JSON.parse(raw) as JSONValue;
        return success(json);
      } catch (err: unknown) {
        return error(getErrorMessage(err));
      }
    }),
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
