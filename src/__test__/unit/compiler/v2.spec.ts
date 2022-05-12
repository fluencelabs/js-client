import each from 'jest-each';

import { Fluence, FluencePeer } from '../../..';
import { forTests } from '../../../internal/compilerSupport/v2';

const peer = new FluencePeer();
const cfg = { ttl: 1000 };

describe('Compiler support tests', () => {
    each`
    rawArgs              | numArgs | expectedArgs   | expectedConfig  | isExpectedPeerDefault
    ${[]}                | ${0}    | ${[]}          | ${undefined}    | ${true}
    ${[cfg]}             | ${0}    | ${[]}          | ${cfg}          | ${true}
    ${[peer]}            | ${0}    | ${[]}          | ${undefined}    | ${false}
    ${[peer, cfg]}       | ${0}    | ${[]}          | ${cfg}          | ${false}
    ${['a']}             | ${1}    | ${['a']}       | ${undefined}    | ${true}
    ${['a', cfg]}        | ${1}    | ${['a']}       | ${cfg}          | ${true}
    ${[peer, 'a']}       | ${1}    | ${['a']}       | ${undefined}    | ${false}
    ${[peer, 'a', cfg]}  | ${1}    | ${['a']}       | ${cfg}          | ${false}
`.test(
        //
        'raw rawArgs: $rawArgs, numArgs: $numArgs. expected args: $expectedArgs, config: $expectedConfig, default peer?: $isExpectedPeerDefault',
        ({ rawArgs, numArgs, expectedArgs, expectedConfig, isExpectedPeerDefault }) => {
            // arrange
            const testFn = forTests.extractFunctionArgs;

            // act
            const { peer, config, args } = testFn(rawArgs, numArgs);
            const isActualPeerDefault = Fluence.getPeer() === peer;

            // assert
            expect(config).toStrictEqual(expectedConfig);
            expect(args).toStrictEqual(expectedArgs);
            expect(isActualPeerDefault).toStrictEqual(isExpectedPeerDefault);
        },
    );
});
