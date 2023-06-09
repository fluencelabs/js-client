import { CallParams } from '@fluencelabs/interfaces';
import { TracingDef } from "./_aqua/tracing.js";

export class Tracing implements TracingDef {
    tracingEvent(
        arrowName: string,
        event: string,
        callParams: CallParams<"arrowName" | "event">
    ): void {
        console.log(
            "[%s] (%s) %s", callParams.particleId, arrowName, event
        )
    }
}