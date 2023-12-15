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

import { JSONValue, NonArrowSimpleType } from "@fluencelabs/interfaces";
import { it, describe, expect, test } from "vitest";

import { aqua2js, js2aqua } from "../conversions.js";

const i32 = { tag: "scalar", name: "i32" } as const;

const opt_i32 = {
  tag: "option",
  type: i32,
} as const;

const array_i32 = { tag: "array", type: i32 };

const array_opt_i32 = { tag: "array", type: opt_i32 };

const labeledProduct = {
  tag: "labeledProduct",
  fields: {
    a: i32,
    b: opt_i32,
    c: array_opt_i32,
  },
};

const struct = {
  tag: "struct",
  name: "someStruct",
  fields: {
    a: i32,
    b: opt_i32,
    c: array_opt_i32,
  },
};

const structs = [
  {
    aqua: {
      a: 1,
      b: [2],
      c: [[1], [2]],
    },

    ts: {
      a: 1,
      b: 2,
      c: [1, 2],
    },
  },
  {
    aqua: {
      a: 1,
      b: [],
      c: [[], [2]],
    },

    ts: {
      a: 1,
      b: null,
      c: [null, 2],
    },
  },
] as const;

const labeledProduct2 = {
  tag: "labeledProduct",
  fields: {
    x: i32,
    y: i32,
  },
};

const nestedLabeledProductType = {
  tag: "labeledProduct",
  fields: {
    a: labeledProduct2,
    b: {
      tag: "option",
      type: labeledProduct2,
    },
    c: {
      tag: "array",
      type: labeledProduct2,
    },
  },
};

const nestedStructs = [
  {
    aqua: {
      a: {
        x: 1,
        y: 2,
      },
      b: [
        {
          x: 1,
          y: 2,
        },
      ],
      c: [
        {
          x: 1,
          y: 2,
        },
        {
          x: 3,
          y: 4,
        },
      ],
    },

    ts: {
      a: {
        x: 1,
        y: 2,
      },
      b: {
        x: 1,
        y: 2,
      },

      c: [
        {
          x: 1,
          y: 2,
        },
        {
          x: 3,
          y: 4,
        },
      ],
    },
  },
  {
    aqua: {
      a: {
        x: 1,
        y: 2,
      },
      b: [],
      c: [],
    },

    ts: {
      a: {
        x: 1,
        y: 2,
      },
      b: null,
      c: [],
    },
  },
] as const;

interface ConversionTestArgs {
  aqua: JSONValue;
  ts: JSONValue;
  type: NonArrowSimpleType;
}

describe("Conversion from aqua to typescript", () => {
  test.each`
    aqua                     | ts                     | type
    ${1}                     | ${1}                   | ${i32}
    ${[]}                    | ${null}                | ${opt_i32}
    ${[1]}                   | ${1}                   | ${opt_i32}
    ${[1, 2, 3]}             | ${[1, 2, 3]}           | ${array_i32}
    ${[]}                    | ${[]}                  | ${array_i32}
    ${[[1]]}                 | ${[1]}                 | ${array_opt_i32}
    ${[[]]}                  | ${[null]}              | ${array_opt_i32}
    ${[[1], [2]]}            | ${[1, 2]}              | ${array_opt_i32}
    ${[[], [2]]}             | ${[null, 2]}           | ${array_opt_i32}
    ${structs[0].aqua}       | ${structs[0].ts}       | ${labeledProduct}
    ${structs[1].aqua}       | ${structs[1].ts}       | ${labeledProduct}
    ${structs[0].aqua}       | ${structs[0].ts}       | ${struct}
    ${structs[1].aqua}       | ${structs[1].ts}       | ${struct}
    ${nestedStructs[0].aqua} | ${nestedStructs[0].ts} | ${nestedLabeledProductType}
    ${nestedStructs[1].aqua} | ${nestedStructs[1].ts} | ${nestedLabeledProductType}
  `(
    //
    "aqua: $aqua. ts: $ts. type: $type",
    ({ aqua, ts, type }: ConversionTestArgs) => {
      // arrange

      // act
      const tsFromAqua = aqua2js(aqua, type);
      const aquaFromTs = js2aqua(ts, type, { path: [] });

      // assert
      expect(tsFromAqua).toStrictEqual(ts);
      expect(aquaFromTs).toStrictEqual(aqua);
    },
  );
});

describe("Conversion corner cases", () => {
  it("Should accept undefined in object entry", () => {
    // arrange
    const type = {
      tag: "labeledProduct",
      fields: {
        x: opt_i32,
        y: opt_i32,
      },
    } as const;

    const valueInTs = {
      x: 1,
    };

    const valueInAqua = {
      x: [1],
      y: [],
    };

    // act
    const aqua = js2aqua(valueInTs, type, { path: [] });
    const ts = aqua2js(valueInAqua, type);

    // assert
    expect(aqua).toStrictEqual({
      x: [1],
      y: [],
    });

    expect(ts).toStrictEqual({
      x: 1,
      y: null,
    });
  });
});
