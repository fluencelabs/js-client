/*
 * Copyright 2022 Fluence Labs Limited
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

import { callAvm, CallResultsArray, InterpreterResult, LogLevel, RunParameters } from '@fluencelabs/avm';
import { FluenceAppService } from '@fluencelabs/marine-js';

/**
 * @deprecated. AVM run through marine-js infrastructure. This type is needed for backward compatibility with the previous API
 */
export type AvmRunner = {
    init: (logLevel: LogLevel) => Promise<void>;
    terminate: () => Promise<void>;
    run: (
        air: string,
        prevData: Uint8Array,
        data: Uint8Array,
        params: RunParameters,
        callResults: CallResultsArray,
    ) => Promise<InterpreterResult>;
};

/**
 * @deprecated. AVM run through marine-js infrastructure. This type is needed for backward compatibility with the previous API
 */
export class AVM implements AvmRunner {
    private _fluenceAppService: FluenceAppService;

    constructor(fluenceAppService: FluenceAppService) {
        this._fluenceAppService = fluenceAppService;
    }

    async init(logLevel: LogLevel): Promise<void> {}

    async terminate(): Promise<void> {}

    async run(
        air: string,
        prevData: Uint8Array,
        data: Uint8Array,
        runParams: RunParameters,
        callResults: CallResultsArray,
    ): Promise<InterpreterResult> {
        return callAvm(
            (args) => this._fluenceAppService.callService('avm', 'invoke', args, undefined),
            runParams,
            air,
            prevData,
            data,
            callResults,
        );
    }
}
