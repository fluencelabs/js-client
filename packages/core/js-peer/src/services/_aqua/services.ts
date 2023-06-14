/**
 * This compiled aqua file was modified to make it work in monorepo
 */
import { CallParams, IFluenceInternalApi } from '@fluencelabs/interfaces';
import { registerService } from '../../compilerSupport/registerService.js';

// Services

export interface SigDef {
    get_peer_id: (callParams: CallParams<null>) => string | Promise<string>;
    sign: (
        data: number[],
        callParams: CallParams<'data'>,
    ) =>
        | { error: string | null; signature: number[] | null; success: boolean }
        | Promise<{ error: string | null; signature: number[] | null; success: boolean }>;
    verify: (
        signature: number[],
        data: number[],
        callParams: CallParams<'signature' | 'data'>,
    ) => boolean | Promise<boolean>;
}

export function registerSig(peer: IFluenceInternalApi, serviceId: string, service: any) {
    registerService({
        peer,
        service,
        serviceId,
        def: {
            defaultServiceId: 'sig',
            functions: {
                tag: 'labeledProduct',
                fields: {
                    get_peer_id: {
                        tag: 'arrow',
                        domain: {
                            tag: 'nil',
                        },
                        codomain: {
                            tag: 'unlabeledProduct',
                            items: [
                                {
                                    tag: 'scalar',
                                    name: 'string',
                                },
                            ],
                        },
                    },
                    sign: {
                        tag: 'arrow',
                        domain: {
                            tag: 'labeledProduct',
                            fields: {
                                data: {
                                    tag: 'array',
                                    type: {
                                        tag: 'scalar',
                                        name: 'u8',
                                    },
                                },
                            },
                        },
                        codomain: {
                            tag: 'unlabeledProduct',
                            items: [
                                {
                                    tag: 'struct',
                                    name: 'SignResult',
                                    fields: {
                                        error: {
                                            tag: 'option',
                                            type: {
                                                tag: 'scalar',
                                                name: 'string',
                                            },
                                        },
                                        signature: {
                                            tag: 'option',
                                            type: {
                                                tag: 'array',
                                                type: {
                                                    tag: 'scalar',
                                                    name: 'u8',
                                                },
                                            },
                                        },
                                        success: {
                                            tag: 'scalar',
                                            name: 'bool',
                                        },
                                    },
                                },
                            ],
                        },
                    },
                    verify: {
                        tag: 'arrow',
                        domain: {
                            tag: 'labeledProduct',
                            fields: {
                                signature: {
                                    tag: 'array',
                                    type: {
                                        tag: 'scalar',
                                        name: 'u8',
                                    },
                                },
                                data: {
                                    tag: 'array',
                                    type: {
                                        tag: 'scalar',
                                        name: 'u8',
                                    },
                                },
                            },
                        },
                        codomain: {
                            tag: 'unlabeledProduct',
                            items: [
                                {
                                    tag: 'scalar',
                                    name: 'bool',
                                },
                            ],
                        },
                    },
                },
            },
        },
    });
}

// Functions
