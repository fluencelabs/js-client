import type { JestConfigWithTsJest } from 'ts-jest';

export const jestConfig: JestConfigWithTsJest = {
    preset: 'ts-jest',
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
        // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
        // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
            },
        ],
    },
    testEnvironment: 'node',
    testTimeout: 10000,
    testPathIgnorePatterns: ['dist'],
};

export default jestConfig;
