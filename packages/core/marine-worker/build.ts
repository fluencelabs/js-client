import { build, defineConfig, InlineConfig, PluginOption, UserConfig, UserConfigExport } from 'vite'
import { dirname, resolve } from 'path';
import { builtinModules, createRequire } from 'module';
import inject from '@rollup/plugin-inject';
// @ts-ignore
import merge from 'deepmerge';
import { fileURLToPath } from 'url';
import { replaceCodePlugin } from 'vite-plugin-replace';

const require = createRequire(import.meta.url);
const esbuildShim = require.resolve('node-stdlib-browser/helpers/esbuild/shim');

const commonConfig = defineConfig({
    build: {
        lib: {
            entry: resolve(dirname(fileURLToPath(import.meta.url)), 'src/index.ts'),
            name: 'MarineWorker'
        },
    },
}) as UserConfig;

const browserConfig: InlineConfig = await merge(commonConfig, defineConfig({
    build: {
        outDir: 'dist/browser',
    },
    plugins: [{
        // @ts-ignore
        ...inject({
            global: [esbuildShim, 'global'],
            process: [esbuildShim, 'process'],
            Buffer: [esbuildShim, 'Buffer']
        }), enforce: 'post'
    } as PluginOption],
}) as UserConfig);

const nodeConfig: InlineConfig = await merge(commonConfig, defineConfig({
    build: {
        target: 'es2022',
        outDir: 'dist/node',
        rollupOptions: {
            external: [...builtinModules],
            plugins: [
                // @ts-ignore
                inject({
                    self: 'global',
                    'WorkerScope': ['worker_threads', '*'],
                    'Worker': ['worker_threads', 'Worker'],
                    'isMainThread': ['worker_threads', 'isMainThread'],
                })
            ]
        }
    },
    plugins: [
        replaceCodePlugin({
            replacements: [
                { from: 'eval("require")("worker_threads")', to: 'WorkerScope' },
                { from: 'eval("require")("worker_threads")', to: 'WorkerScope' },
            ]
        })
    ],
    resolve: {
        browserField: false,
    }
}) as UserConfig);


await build(browserConfig!);
await build(nodeConfig!);