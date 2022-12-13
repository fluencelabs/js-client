import type { CallResultsArray, InterpreterResult, RunParameters } from '@fluencelabs/avm';
import { deserializeAvmResult, serializeAvmArgs } from '@fluencelabs/avm';
import type { LogLevel } from '@fluencelabs/marine-js';
import type { IMarine, IAvmRunner, IWasmLoader } from '@fluencelabs/interfaces';

export class MarineBasedAvmRunner implements IAvmRunner {
    constructor(private marine: IMarine, private avmWasmLoader: IWasmLoader, private logLevel: LogLevel | undefined) {}

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
        await this.marine.createService(this.avmWasmLoader.getWasm(), 'avm', this.logLevel);
    }

    async stop(): Promise<void> {}
}
