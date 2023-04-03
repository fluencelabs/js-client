/*
 * Copyright 2023 Fluence Labs Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { MarineBackgroundRunner } from '@fluencelabs/marine.background-runner';
import { MarineBasedAvmRunner } from '@fluencelabs/js-peer/dist/avm';
import { marineLogFunction } from '@fluencelabs/js-peer/dist/utils';
import { FluencePeer } from '@fluencelabs/js-peer/dist/FluencePeer';
import { InlinedWorkerLoader, WasmWebLoader } from '@fluencelabs/marine.deps-loader.web';

export const defaultNames = {
    avm: 'avm.wasm',
    marine: 'marine-js.wasm',
};

export const makeDefaultPeer = () => {
    const workerLoader = new InlinedWorkerLoader();
    const controlModuleLoader = new WasmWebLoader(defaultNames.marine);
    const avmModuleLoader = new WasmWebLoader(defaultNames.avm);

    const marine = new MarineBackgroundRunner(workerLoader, controlModuleLoader, marineLogFunction);
    const avm = new MarineBasedAvmRunner(marine, avmModuleLoader, undefined);
    return new FluencePeer(marine, avm);
};

// @ts-ignore
globalThis.defaultPeer = makeDefaultPeer();
