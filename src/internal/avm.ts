import { callAvm, CallResultsArray, InterpreterResult, LogLevel } from '@fluencelabs/avm';
import { FluenceAppService } from '@fluencelabs/marine-js';

export type AvmRunner = {
    init: (logLevel: LogLevel) => Promise<void>;
    terminate: () => Promise<void>;
    run: (
        air: string,
        prevData: Uint8Array,
        data: Uint8Array,
        params: {
            initPeerId: string;
            currentPeerId: string;
        },
        callResults: CallResultsArray,
    ) => Promise<InterpreterResult>;
};

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
