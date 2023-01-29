import { WasmNpmLoader } from '../marine/deps-loader/node';

export const controlModuleLoader = new WasmNpmLoader('@fluencelabs/marine-js', 'marine-js.wasm');
export const avmModuleLoader = new WasmNpmLoader('@fluencelabs/avm', 'avm.wasm');
