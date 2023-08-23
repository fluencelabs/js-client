import path, { dirname } from 'path';
import type { InlineConfig, PluginOption } from 'vite';
import { build } from 'vite';
import { builtinModules, createRequire } from 'module';
import tsconfigPaths from 'vite-tsconfig-paths';
import inject from '@rollup/plugin-inject';
import stdLibBrowser from 'node-stdlib-browser';
import { fileURLToPath } from 'url';
import { rm, rename } from 'fs/promises';
import { replaceCodePlugin } from 'vite-plugin-replace';
import pkg from './package.json' assert { type: 'json' };
import libAssetsPlugin from '@laynezh/vite-plugin-lib-assets';

const require = createRequire(import.meta.url);

const commonConfig = (isNode: boolean): InlineConfig & Required<Pick<InlineConfig, 'build'>> => {
    const esbuildShim = require.resolve('node-stdlib-browser/helpers/esbuild/shim');
    return {
        build: {
            target: 'modules',
            minify: 'esbuild',
            lib: {
                entry: './src/index.ts',
                name: 'js-client',
                fileName: `${isNode ? 'node' : 'browser'}/index`,
            },
            outDir: './dist',
            emptyOutDir: false,
            ...(isNode ? {
                rollupOptions: {
                    external: [...builtinModules, ...builtinModules.map(bm => `node:${bm}`)],
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
            } : {
                rollupOptions: {
                    plugins: [
                        {
                            // @ts-ignore
                            ...inject({
                                global: [esbuildShim, 'global'],
                                process: [esbuildShim, 'process'],
                                Buffer: [esbuildShim, 'Buffer']
                            }), enforce: 'post'
                        }
                    ],
                }
            })
        },
        plugins: [tsconfigPaths(), libAssetsPlugin({
            include: ['**/*.wasm*', '**/marine-worker.umd.cjs*'],
            publicUrl: '/',
        }), ...(isNode ? [replaceCodePlugin({
        replacements: [
            { from: 'require(`./${file}.js`)', to: 'require(`./linux.js`)' },
            {
                from: 'const { name, version } = req(\'../../package.json\')',
                to: 'const { name, version } = { name: \'ssdp\', version: \'4.0.4\' }'
            },
            { from: 'eval("require")("worker_threads")', to: 'WorkerScope' },
            { from: 'eval("require")("worker_threads")', to: 'WorkerScope' },
        ]
    })] : [])] as PluginOption[],
        optimizeDeps: {
            esbuildOptions: {
                define: {
                    global: 'globalThis',
                },
            },
        },
        resolve: {
            browserField: !isNode,
            conditions: isNode ? ['node'] : ['browser']
        },
        // Used only by browser
        define: {
            __JS_CLIENT_VERSION__: pkg.version,
            __ENV__: isNode ? 'node' : 'browser'
        },
    };
};

const buildClient = async () => {
    const nodeConfig = commonConfig(true);
    const browserConfig = commonConfig(false);
    
    try {
        await rm('./dist', { recursive: true });
    } catch {}

    await build(nodeConfig);
    await build(browserConfig);
};

buildClient()
    .then(() => console.log('Built successfully'))
    .catch((err) => console.error('failed', err));
