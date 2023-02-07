/**
 *
 * This file is auto-generated. Do not edit manually: changes may be erased.
 * Generated by Aqua compiler: https://github.com/fluencelabs/aqua/.
 * If you find any bugs, please write an issue on GitHub: https://github.com/fluencelabs/aqua/issues
 * Aqua version: 0.7.2-314
 *
 */
import type { IFluencePeer } from '@fluencelabs/js-peer/dist/interfaces';
import type { CallParams } from '@fluencelabs/js-peer/dist/interfaces/commonTypes';
import { callFunction$$, registerService$$ } from '@fluencelabs/js-client.api/dist/compilerSupport/v4';

// Services

export interface PeerDef {
    timestamp_ms: (callParams: CallParams<null>) => number | Promise<number>;
}
export function registerPeer(service: PeerDef): void;
export function registerPeer(serviceId: string, service: PeerDef): void;
export function registerPeer(peer: IFluencePeer, service: PeerDef): void;
export function registerPeer(peer: IFluencePeer, serviceId: string, service: PeerDef): void;

export function registerPeer(...args: any) {
    registerService$$(args, {
        defaultServiceId: 'peer',
        functions: {
            tag: 'labeledProduct',
            fields: {
                timestamp_ms: {
                    tag: 'arrow',
                    domain: {
                        tag: 'nil',
                    },
                    codomain: {
                        tag: 'unlabeledProduct',
                        items: [
                            {
                                tag: 'scalar',
                                name: 'u64',
                            },
                        ],
                    },
                },
            },
        },
    });
}

// Functions

export function getRelayTime(relayPeerId: string, config?: { ttl?: number }): Promise<number>;

export function getRelayTime(peer: IFluencePeer, relayPeerId: string, config?: { ttl?: number }): Promise<number>;

export function getRelayTime(...args: any) {
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
    return callFunction$$(
        args,
        {
            functionName: 'getRelayTime',
            arrow: {
                tag: 'arrow',
                domain: {
                    tag: 'labeledProduct',
                    fields: {
                        relayPeerId: {
                            tag: 'scalar',
                            name: 'string',
                        },
                    },
                },
                codomain: {
                    tag: 'unlabeledProduct',
                    items: [
                        {
                            tag: 'scalar',
                            name: 'u64',
                        },
                    ],
                },
            },
            names: {
                relay: '-relay-',
                getDataSrv: 'getDataSrv',
                callbackSrv: 'callbackSrv',
                responseSrv: 'callbackSrv',
                responseFnName: 'response',
                errorHandlingSrv: 'errorHandlingSrv',
                errorFnName: 'error',
            },
        },
        script,
    );
}