import each from 'jest-each';
import { aqua2ts, ts2aqua } from '../../../internal/compilerSupport/v3impl/conversions';

const i32 = { tag: 'scalar', name: 'i32' } as const;
const optI32 = {
    tag: 'option',
    type: {
        tag: 'scalar',
        name: 'i32',
    },
} as const;

describe('Conversion from aqua to typescript', () => {
    each`
    arg                | type         | expected
    ${1}               | ${i32}       | ${1}
    ${[]}              | ${optI32}    | ${null}
    ${[1]}             | ${optI32}    | ${1}
`.test(
        //
        'arg: $arg, type: $type. expected: $expected',
        async ({ arg, type, expected }) => {
            // arrange

            // act
            const res = aqua2ts(arg, type);

            // assert
            expect(res).toStrictEqual(expected);
        },
    );
});

describe('Conversion from typescript to aqua', () => {
    each`
    arg                | type         | expected
    ${1}               | ${i32}       | ${1}
    ${null}            | ${optI32}    | ${[]}
    ${1}               | ${optI32}    | ${[1]}
`.test(
        //
        'arg: $arg, type: $type. expected: $expected',
        async ({ arg, type, expected }) => {
            // arrange

            // act
            const res = ts2aqua(arg, type);

            // assert
            expect(res).toStrictEqual(expected);
        },
    );
});
