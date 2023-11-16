/* eslint-disable */
// @ts-nocheck
/**
 *
 * This file is generated using:
 * @fluencelabs/aqua-api version: 0.12.0
 * @fluencelabs/aqua-to-js version: 0.2.0
 * If you find any bugs in generated AIR, please write an issue on GitHub: https://github.com/fluencelabs/aqua/issues
 * If you find any bugs in generated JS/TS, please write an issue on GitHub: https://github.com/fluencelabs/js-client/issues
 *
 */
import type { IFluenceClient as IFluenceClient$$, ParticleContext as ParticleContext$$ } from '@fluencelabs/js-client';

// Making aliases to reduce chance of accidental name collision
import {
    v5_callFunction as callFunction$$,
    v5_registerService as registerService$$,
    FluencePeer as FluencePeer$$
} from '@fluencelabs/js-client';


// Functions
export const test_script = `
(seq
 (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
 (xor
  (xor
   (call -relay- ("op" "noop") [])
   (fail %last_error%)
  )
  (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 0])
 )
)
`;

export type testParams = [config?: {ttl?: number}] | [peer: IFluenceClient$$, config?: {ttl?: number}];

export type TestResult = Promise<void>;

export function test(...args: testParams): TestResult {
    return callFunction$$(
        args,
        {
    "functionName": "test",
    "arrow": {
        "domain": {
            "fields": {},
            "tag": "labeledProduct"
        },
        "codomain": {
            "tag": "nil"
        },
        "tag": "arrow"
    },
    "names": {
        "relay": "-relay-",
        "getDataSrv": "getDataSrv",
        "callbackSrv": "callbackSrv",
        "responseSrv": "callbackSrv",
        "responseFnName": "response",
        "errorHandlingSrv": "errorHandlingSrv",
        "errorFnName": "error"
    }
},
        test_script
    );
}
