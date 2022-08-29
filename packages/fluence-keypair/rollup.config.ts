import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import clear from 'rollup-plugin-clear';
import shebang from 'rollup-plugin-preserve-shebang';
import { swc, minify } from 'rollup-plugin-swc3';
import dts from 'rollup-plugin-dts';
// import flatDts from 'rollup-plugin-flat-dts';

const commonPlugins = [
    swc({
        sourceMaps: true,
    }),
    // minify(),
    clear({
        targets: ['dist', 'types', 'esm'],
    }),
];

const commonInput = './src/index.ts';

export default [
    {
        input: commonInput,
        output: [
            {
                dir: 'dist',
            },
        ],
        plugins: [dts()],
    },
    {
        input: commonInput,
        output: [
            {
                sourcemap: true,
                dir: 'dist',
                format: 'cjs',
            },
            // {
            //     sourcemap: true,
            //     dir: 'esm',
            //     format: 'esm',
            // },
        ],
        plugins: [
            nodeResolve(),
            commonjs({
                ignoreDynamicRequires: true,
            }),
            ...commonPlugins,
        ],
    },
];
