/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    extensionsToTreatAsEsm: ['.ts'],
    testPathIgnorePatterns: ['dist'],
    "preset": "ts-jest/presets/default-esm",
    "moduleNameMapper": {
        "^(\\.{1,2}/.*)\\.js$": "$1"
    },
    "transform": {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                "useESM": true
            }
        ]
    },

    tsConfig: {
        skipLibCheck: true
    }
    
};
