import {defineConfig} from 'vite'
import {resolve} from 'path';
import {createRequire} from "module";
import inject from "@rollup/plugin-inject";

const require = createRequire(import.meta.url);
const esbuildShim = require.resolve('node-stdlib-browser/helpers/esbuild/shim');

export default defineConfig({
    build: {
        target: 'es6',
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'MarineWorker',
        },
    },
    plugins: [{
        ...inject({
            global: [esbuildShim, 'global'],
            process: [esbuildShim, 'process'],
            Buffer: [esbuildShim, 'Buffer']
        }), enforce: 'post'
    }]
})