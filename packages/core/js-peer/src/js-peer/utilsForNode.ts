import { WorkerLoaderFromFs, WasmLoaderFromFs, WasmLoaderFromNpm } from '../marine/deps-loader/node.js';

// TODO!: after moving to ESM loaders stopped working. Should be fixed in scope of DXJ-194
export const controlModuleLoader = new WasmLoaderFromNpm('@fluencelabs/marine-js', 'marine-js.wasm');
export const avmModuleLoader = new WasmLoaderFromNpm('@fluencelabs/avm', 'avm.wasm');
