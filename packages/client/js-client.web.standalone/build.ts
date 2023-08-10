import fs from 'fs';
import path, { dirname, join, resolve } from 'path';
import { fromUint8Array } from 'js-base64';
import type { InlineConfig, PluginOption } from 'vite';
import { build } from 'vite';
import { createRequire } from 'module';
import tsconfigPaths from 'vite-tsconfig-paths';
import inject from '@rollup/plugin-inject';
import stdLibBrowser from 'node-stdlib-browser';
import { fileURLToPath } from 'url';
import libAssetsPlugin from '@laynezh/vite-plugin-lib-assets'
import pkg from './package.json' assert { type: 'json' };

const require = createRequire(import.meta.url);


const getWorkerScriptPathOrDie = () => {
    const scriptPath = resolve('../../core/js-peer/dist/marine/worker-script/index.js');
    if (!fs.existsSync(scriptPath)) {
        console.error('Worker script not found, looking at: ' + scriptPath);
        process.exit(1);
    }

    return scriptPath;
};

const commonConfig = (opts: {
    outDir: string;
    name: string;
    entry: string;
}): InlineConfig & Required<Pick<InlineConfig, 'build'>> => {
    const esbuildShim = require.resolve('node-stdlib-browser/helpers/esbuild/shim');
    // @ts-ignore
    return {
        build: {
            minify: 'esbuild',
            lib: {
                entry: opts.entry,
                name: opts.name,
                fileName: opts.name,
            },
            outDir: opts.outDir,
        },
        base: '',
        plugins: [tsconfigPaths(), {...inject({
                global: [esbuildShim, 'global'],
                process: [esbuildShim, 'process'],
                Buffer: [esbuildShim, 'Buffer']
            }), enforce: 'post'}, libAssetsPlugin({
            include: ['**/*.wasm', '**/marine-worker.js'],
            publicUrl: '/'
        })] as PluginOption[],
        optimizeDeps: {
            esbuildOptions: {
                define: {
                    global: 'globalThis',
                },
            },
        },
        resolve: {
            alias: {
                ...stdLibBrowser,
                net: 'node-stdlib-browser/esm/mock/net',
                dgram: path.resolve(dirname(fileURLToPath(import.meta.url)), 'mocks/dgram'),
                module: path.resolve(dirname(fileURLToPath(import.meta.url)), 'mocks/module'),
            }
        },
        define: {
            __CLIENT_ENV__: 'browser',
            __MARINE_VERSION__: pkg.devDependencies['@fluencelabs/marine-js'],
            __AVM_VERSION__: pkg.devDependencies['@fluencelabs/avm'],
            __WORKER_VERSION__: pkg.devDependencies['@fluencelabs/marine-worker'].split(':')[1],
            __CDN_ROOT__: 'https://unpkg.com/'
        }
    };
};

const readAsBase64 = async (filePath: string): Promise<string> => {
    const scriptRaw = await fs.promises.readFile(filePath);
    const b64 = fromUint8Array(scriptRaw);
    return b64;
};

const readWasmFromNpmAsBase64 = (pkg: string, wasmFileName: string): Promise<string> => {
    const pkgPath = require.resolve(pkg);
    const wasmFilePath = join(dirname(pkgPath), wasmFileName);
    return readAsBase64(wasmFilePath);
};

const buildClient = async () => {
    await fs.promises.mkdir('tmp', { recursive: true });

    // build worker script
    const workerConfig = commonConfig({
        outDir: './tmp',
        entry: getWorkerScriptPathOrDie(),
        name: 'worker-script',
    });

    // await build(workerConfig);

    // build js-client
    const jsClientConfig = commonConfig({
        outDir: './dist',
        entry: './src/index.ts',
        name: 'js-client',
    });

    await build(jsClientConfig);

    // We should exclude the script with type=module because
    // - it might be confusing (i.e won't work in browsers that do not support ESM, or if you miss the `type` attribute)
    // - there is a problem when using `self.crypto` in web workers
    await fs.promises.rm('./dist/js-client.js');

    // browsers don't understand `.cjs` extensions, just use `.js`
    await fs.promises.rename('./dist/js-client.umd.cjs', './dist/js-client.min.js');
};

buildClient()
    .then(() => console.log('Built successfully'))
    .catch((err) => console.error('failed', err));
