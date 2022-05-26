import { nodeResolve } from '@rollup/plugin-node-resolve';
import ts from 'rollup-plugin-ts';
import commonjs from '@rollup/plugin-commonjs';
import clear from 'rollup-plugin-clear';
import shebang from 'rollup-plugin-preserve-shebang';
import { terser } from 'rollup-plugin-terser';

const plugins = [
    ts(),
    nodeResolve(),
    commonjs(),
    terser(),
    clear({
        targets: ['dist'],
    }),
];

export default [
    {
        input: {
            index: 'src/index.ts',
            services: 'src/services.ts',
            'internal/compilerSupport/v2': 'src/internal/compilerSupport/v2.ts',
            'internal/compilerSupport/v3': 'src/internal/compilerSupport/v3.ts',
        },
        output: [
            {
                dir: 'dist/cjs',
                format: 'cjs',
            },
            {
                dir: 'dist/esm',
                format: 'esm',
            },
        ],
        plugins: plugins,
    },
    {
        input: 'src/tools/copyMarine.ts',
        output: {
            file: 'dist/copyMarine.js',
            format: 'cjs',
        },
        plugins: [shebang(), ts()],
    },
];
