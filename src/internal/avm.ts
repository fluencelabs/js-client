import { AvmRunner, CallResultsArray, InterpreterResult, LogLevel } from '@fluencelabs/avm-runner-interface';
import { callAvm } from '@fluencelabs/avm';
import { FluenceAppService } from '@fluencelabs/marine-js';

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
        params: { initPeerId: string; currentPeerId: string },
        callResults: CallResultsArray,
    ): Promise<InterpreterResult> {
        return callAvm(
            (args) => this._fluenceAppService.callService('avm', 'invoke', args, undefined),
            params.initPeerId,
            params.currentPeerId,
            air,
            prevData,
            data,
            callResults,
        );
    }
}
