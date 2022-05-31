commonjs({ include: '../../node_modules/.pnpm/registry.npmjs.org/**' });

import { nodeResolve } from '@rollup/plugin-node-resolve';
// import ts from 'rollup-plugin-ts';
import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import clear from 'rollup-plugin-clear';
import shebang from 'rollup-plugin-preserve-shebang';
import { terser } from 'rollup-plugin-terser';
// import swc from 'rollup-plugin-swc';
import { swc } from 'rollup-plugin-swc3';

const plugins = [
    // typescript({}),
    swc({
        // All options are optional
        include: /\.[jt]sx?$/, // default
        exclude: /node_modules/, // default
        tsconfig: 'tsconfig.json', // default
        // And add your swc configuration here!
        // "filename" will be ignored since it is handled by rollup
        jsc: {},
    }),
    // ts({
    //     preserveSymlinks: true,
    // }),
    nodeResolve({
        preserveSymlinks: true,
    }),
    commonjs({
        preserveSymlinks: true,
    }),
    terser(),
    clear({
        targets: ['dist'],
    }),
];

export default [
    {
        preserveSymlinks: true,
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
    /*
    {
        preserveSymlinks: true,
        input: 'src/tools/copyMarine.ts',
        output: {
            file: 'dist/copyMarine.js',
            format: 'cjs',
        },
        plugins: [shebang(), ts()],
    },
    */
];
