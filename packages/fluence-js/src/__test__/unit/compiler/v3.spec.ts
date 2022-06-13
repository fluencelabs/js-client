import each from 'jest-each';
import { aqua2ts, ts2aqua } from '../../../internal/compilerSupport/v3impl/conversions';

const i32 = { tag: 'scalar', name: 'i32' } as const;

const opt_i32 = {
    tag: 'option',
    type: i32,
} as const;

const array_i32 = { tag: 'array', type: i32 };

const array_opt_i32 = { tag: 'array', type: opt_i32 };

const labeledProduct = {
    tag: 'labeledProduct',
    fields: {
        a: i32,
        b: opt_i32,
        c: array_opt_i32,
    },
};

const struct = {
    tag: 'struct',
    name: 'someStruct',
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
];

const labeledProduct2 = {
    tag: 'labeledProduct',
    fields: {
        x: i32,
        y: i32,
    },
};

const nestedLabeledProductType = {
    tag: 'labeledProduct',
    fields: {
        a: labeledProduct2,
        b: {
            tag: 'option',
            type: labeledProduct2,
        },
        c: {
            tag: 'array',
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
];

describe('Conversion from aqua to typescript', () => {
    each`
    aqua                            | ts                       | type               
    ${1}                            | ${1}                     | ${i32}             
    ${[]}                           | ${null}                  | ${opt_i32}         
    ${[1]}                          | ${1}                     | ${opt_i32}         
    ${[1, 2, 3]}                    | ${[1, 2, 3]}             | ${array_i32}       
    ${[]}                           | ${[]}                    | ${array_i32}       
    ${[[1]]}                        | ${[1]}                   | ${array_opt_i32}   
    ${[[]]}                         | ${[null]}                | ${array_opt_i32}   
    ${[[1], [2]]}                   | ${[1, 2]}                | ${array_opt_i32}   
    ${[[], [2]]}                    | ${[null, 2]}             | ${array_opt_i32}   
    ${structs[0].aqua}              | ${structs[0].ts}         | ${labeledProduct}  
    ${structs[1].aqua}              | ${structs[1].ts}         | ${labeledProduct}  
    ${structs[0].aqua}              | ${structs[0].ts}         | ${struct}          
    ${structs[1].aqua}              | ${structs[1].ts}         | ${struct}          
    ${nestedStructs[0].aqua}        | ${nestedStructs[0].ts}   | ${nestedLabeledProductType}          
    ${nestedStructs[1].aqua}        | ${nestedStructs[1].ts}   | ${nestedLabeledProductType}          
`.test(
        //
        'aqua: $aqua. ts: $ts. type: $type',
        async ({ aqua, ts, type }) => {
            // arrange

            // act
            const tsFromAqua = aqua2ts(aqua, type);
            const aquaFromTs = ts2aqua(ts, type);

            // assert
            expect(tsFromAqua).toStrictEqual(ts);
            expect(aquaFromTs).toStrictEqual(aqua);
        },
    );
});

describe('Conversion corner cases', () => {
    it('Should accept undefined in object entry', () => {
        // arrange
        const type = {
            tag: 'labeledProduct',
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
        const aqua = ts2aqua(valueInTs, type);
        const ts = aqua2ts(valueInAqua, type);

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
