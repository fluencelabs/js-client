import {defineConfig} from 'vite'
import {resolve} from 'path';
import {builtinModules} from "module";
import { replaceCodePlugin } from "vite-plugin-replace";
import inject from '@rollup/plugin-inject';
import pkg from './package.json' assert { type: 'json' };
import libAssetsPlugin from "@laynezh/vite-plugin-lib-assets";

export default defineConfig({
    build: {
        target: 'es2022',
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'JSClient',
        },
        rollupOptions: {
            external: [...builtinModules, ...builtinModules.map(bm => `node:${bm}`), 'ws', 'worker_threads'],
            plugins: [
                inject({
                    'WebSocket': ['ws', 'WebSocket'],
                    self: 'global',
                    'WorkerScope': ['worker_threads', '*'], 
                    'Worker': ['worker_threads', 'Worker'],
                    'isMainThread': ['worker_threads', 'isMainThread'],
                })
            ]
        },
    },
    plugins: [replaceCodePlugin({
        replacements: [
            {from: 'require(`./${file}.js`)', to: 'require(`./linux.js`)'},
            {from: 'const { name, version } = req(\'../../package.json\')', to: 'const { name, version } = { name: \'ssdp\', version: \'4.0.4\' }'},
            {from: 'eval("require")("worker_threads")', to: 'WorkerScope'},
            {from: 'eval("require")("worker_threads")', to: 'WorkerScope'},
        ]
    }), libAssetsPlugin({
        include: ['**/marine-worker.umd.cjs'],
        publicUrl: '/'
    })],
    resolve: {
        browserField: false,
        conditions: ['node']
    },
    define: {
        __CLIENT_ENV__: 'node'
    }
})