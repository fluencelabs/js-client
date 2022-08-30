import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import clear from 'rollup-plugin-clear';
import { swc, minify } from 'rollup-plugin-swc3';
import dts from 'rollup-plugin-dts';

const input = './src/index.ts';

export default [
    {
        input: input,
        output: [
            {
                dir: 'dist',
            },
        ],
        plugins: [dts()],
    },
    {
        input: input,
        output: [
            {
                sourcemap: true,
                dir: 'dist',
                format: 'cjs',
            },
        ],
        plugins: [
            nodeResolve(),
            commonjs({
                ignoreDynamicRequires: true,
            }),
            swc({
                sourceMaps: true,
            }),
            minify(),
            clear({
                targets: ['dist'],
            }),
        ],
    },
];
