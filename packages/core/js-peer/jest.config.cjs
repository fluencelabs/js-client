/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    extensionsToTreatAsEsm: ['.ts'],
    "preset": "ts-jest/presets/default-esm", // or other ESM presets,
    "moduleNameMapper": {
        "^(\\.{1,2}/.*)\\.js$": "$1"
    },
    "transform": {
        // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
        // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                "useESM": true
            }
        ]
    }
    
};
