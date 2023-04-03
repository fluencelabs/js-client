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
import type { CallResultsArray, InterpreterResult, RunParameters } from '@fluencelabs/avm';
import { deserializeAvmResult, serializeAvmArgs } from '@fluencelabs/avm';
import { IAvmRunner, IMarineHost, IWasmLoader } from '../marine/interfaces.js';

export class MarineBasedAvmRunner implements IAvmRunner {
    constructor(private marine: IMarineHost, private avmWasmLoader: IWasmLoader) {}

    async run(
        runParams: RunParameters,
        air: string,
        prevData: Uint8Array,
        data: Uint8Array,
        callResults: CallResultsArray,
    ): Promise<InterpreterResult | Error> {
        const args = serializeAvmArgs(runParams, air, prevData, data, callResults);

        let avmCallResult: InterpreterResult | Error;
        try {
            const res = await this.marine.callService('avm', 'invoke', args, undefined);
            avmCallResult = deserializeAvmResult(res);
        } catch (e) {
            avmCallResult = e instanceof Error ? e : new Error((e as any).toString());
        }

        return avmCallResult;
    }

    async start(): Promise<void> {
        await this.marine.start();
        await this.avmWasmLoader.start();
        await this.marine.createService(this.avmWasmLoader.getValue(), 'avm');
    }

    async stop(): Promise<void> {}
}
