import * as fs from 'fs';
import * as path from 'path';
import { fromUint8Array } from 'js-base64';
import { build } from 'vite';
import { createRequire } from 'module';
import type { InlineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as inject from '@rollup/plugin-inject';
import { replaceCodePlugin } from 'vite-plugin-replace';

const require = createRequire(import.meta.url);

const getWorkerScriptPathOrDie = () => {
    const scriptPath = path.resolve('../../core/dist/marine/worker-script/index.js');
    if (!fs.existsSync(scriptPath)) {
        console.error();
        process.exit(1);
    }

    return scriptPath;
};

const commonConfig = (opts: {
    outDir: string;
    name: string;
    entry: string;
}): InlineConfig & Required<Pick<InlineConfig, 'build'>> => {
    return {
        mode: 'production',
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
        plugins: [tsconfigPaths()],
        optimizeDeps: {
            esbuildOptions: {
                define: {
                    global: 'globalThis',
                },
            },
        },
    };
};

const readAsBase64 = async (filePath: string): Promise<string> => {
    const scriptRaw = await fs.promises.readFile(filePath);
    const b64 = fromUint8Array(scriptRaw);
    return b64;
};

const readWasmFromNpmAsBase64 = (pkg: string, wasmFileName: string): Promise<string> => {
    const pkgPath = require.resolve(pkg);
    const wasmFilePath = path.join(path.dirname(pkgPath), wasmFileName);
    return readAsBase64(wasmFilePath);
};

const buildClient = async () => {
    if (!fs.existsSync('./tmp')) {
        await fs.promises.mkdir('./tmp');
    }

    // build worker script
    const workerConfig = commonConfig({
        outDir: './tmp',
        entry: getWorkerScriptPathOrDie(),
        name: 'worker-script',
    });
    workerConfig.build!.rollupOptions = {
        plugins: [
            inject.default({
                Buffer: ['buffer', 'Buffer'],
                process: 'process',
            }),
        ],
    };

    await build(workerConfig);

    // build js-client
    const jsClientConfig = commonConfig({
        outDir: './dist',
        entry: './src/index.ts',
        name: 'js-client',
    });

    const workerScriptB64 = await readAsBase64('./tmp/worker-script.umd.cjs');
    const avmBase64 = await readWasmFromNpmAsBase64('@fluencelabs/avm', 'avm.wasm');
    const marineBase64 = await readWasmFromNpmAsBase64('@fluencelabs/marine-js', 'marine-js.wasm');

    jsClientConfig.plugins!.push(
        replaceCodePlugin({
            replacements: [
                {
                    from: '___worker___',
                    to: workerScriptB64,
                },
                {
                    from: '___avm___',
                    to: avmBase64,
                },
                {
                    from: '___marine___',
                    to: marineBase64,
                },
            ],
        }),
    );

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
