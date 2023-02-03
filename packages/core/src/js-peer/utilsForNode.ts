import { WorkerLoaderFromFs, WasmLoaderFromFs, WasmLoaderFromNpm } from '../marine/deps-loader/node.js';

// export const controlModuleLoader = new WasmNpmLoader('@fluencelabs/marine-js', 'marine-js.wasm');
// export const avmModuleLoader = new WasmNpmLoader('@fluencelabs/avm', 'avm.wasm');

export const controlModuleLoader = new WasmLoaderFromFs(
    '/home/pavel/work/fluence/fluence-js/node_modules/.pnpm/@fluencelabs+marine-js@0.1.1-marine-js-esm-e51255f-251-1.0/node_modules/@fluencelabs/marine-js/dist/marine-js.wasm',
);

export const avmModuleLoader = new WasmLoaderFromFs(
    '/home/pavel/work/fluence/fluence-js/node_modules/.pnpm/@fluencelabs+avm@0.31.10/node_modules/@fluencelabs/avm/dist/avm.wasm',
);
