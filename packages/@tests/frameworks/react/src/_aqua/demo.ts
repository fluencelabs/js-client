/**
 *
 * This file is auto-generated. Do not edit manually: changes may be erased.
 * Generated by Aqua compiler: https://github.com/fluencelabs/aqua/.
 * If you find any bugs, please write an issue on GitHub: https://github.com/fluencelabs/aqua/issues
 * Aqua version: 0.8.0-368
 *
 */

import { callFunctionImpl$$ } from "@fluencelabs/compiler-support/dist/v4";
import type { FluencePeer } from "@fluencelabs/compiler-support/dist/v4";

// Services

// Functions

export function getRelayTime(peer: FluencePeer, relayPeerId: string) {
    let script = `
                    (xor
                     (seq
                      (seq
                       (seq
                        (seq
                         (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
                         (call %init_peer_id% ("getDataSrv" "relayPeerId") [] relayPeerId)
                        )
                        (call -relay- ("op" "noop") [])
                       )
                       (xor
                        (seq
                         (call relayPeerId ("peer" "timestamp_ms") [] ts)
                         (call -relay- ("op" "noop") [])
                        )
                        (seq
                         (call -relay- ("op" "noop") [])
                         (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 1])
                        )
                       )
                      )
                      (xor
                       (call %init_peer_id% ("callbackSrv" "response") [ts])
                       (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 2])
                      )
                     )
                     (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 3])
                    )
    `;
    return callFunctionImpl$$(
        {
            functionName: "getRelayTime",
            arrow: {
                tag: "arrow",
                domain: {
                    tag: "labeledProduct",
                    fields: {
                        relayPeerId: {
                            tag: "scalar",
                            name: "string",
                        },
                    },
                },
                codomain: {
                    tag: "unlabeledProduct",
                    items: [
                        {
                            tag: "scalar",
                            name: "u64",
                        },
                    ],
                },
            },
            names: {
                relay: "-relay-",
                getDataSrv: "getDataSrv",
                callbackSrv: "callbackSrv",
                responseSrv: "callbackSrv",
                responseFnName: "response",
                errorHandlingSrv: "errorHandlingSrv",
                errorFnName: "error",
            },
        },
        script,
        {},
        peer,
        {
            relayPeerId: relayPeerId,
        }
    );
}