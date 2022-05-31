import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import clear from 'rollup-plugin-clear';
import shebang from 'rollup-plugin-preserve-shebang';
import { swc, minify } from 'rollup-plugin-swc3';
import dts from 'rollup-plugin-dts';

const commonPlugins = [
    swc({
        sourceMaps: true,
    }),
    minify(),
    clear({
        targets: ['dist'],
    }),
];

const commonInput = {
    index: 'src/index.ts',
    services: 'src/services.ts',
    'internal/compilerSupport/v2': 'src/internal/compilerSupport/v2.ts',
    'internal/compilerSupport/v3': 'src/internal/compilerSupport/v3.ts',
};

export default [
    {
        input: commonInput,
        output: [
            {
                dir: 'dist/types',
            },
        ],
        plugins: [dts()],
    },
    {
        input: commonInput,
        output: [
            {
                sourcemap: true,
                dir: 'dist/cjs',
                format: 'cjs',
            },
            {
                sourcemap: true,
                dir: 'dist/esm',
                format: 'esm',
            },
        ],
        plugins: [nodeResolve(), commonjs(), ...commonPlugins],
    },
    {
        input: 'src/tools/copyMarine.ts',
        output: {
            file: 'dist/copyMarine.js',
            format: 'cjs',
        },
        plugins: [shebang(), ...commonPlugins],
    },
];
