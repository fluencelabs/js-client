/**
 * This compiled aqua file was modified to make it work in monorepo
 */
import { CallParams, IFluenceInternalApi } from '@fluencelabs/interfaces';
import { registerService } from '../../compilerSupport/registerService.js';

// Services

export interface NodeUtilsDef {
    read_file: (
        path: string,
        callParams: CallParams<'path'>,
    ) =>
        | { content: string | null; error: string | null; success: boolean }
        | Promise<{ content: string | null; error: string | null; success: boolean }>;
}

export function registerNodeUtils(peer: IFluenceInternalApi, serviceId: string, service: any) {
    registerService({
        peer,
        service,
        serviceId,
        def: {
            defaultServiceId: 'node_utils',
            functions: {
                tag: 'labeledProduct',
                fields: {
                    read_file: {
                        tag: 'arrow',
                        domain: {
                            tag: 'labeledProduct',
                            fields: {
                                path: {
                                    tag: 'scalar',
                                    name: 'string',
                                },
                            },
                        },
                        codomain: {
                            tag: 'unlabeledProduct',
                            items: [
                                {
                                    tag: 'struct',
                                    name: 'ReadFileResult',
                                    fields: {
                                        content: {
                                            tag: 'option',
                                            type: {
                                                tag: 'scalar',
                                                name: 'string',
                                            },
                                        },
                                        error: {
                                            tag: 'option',
                                            type: {
                                                tag: 'scalar',
                                                name: 'string',
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
                },
            },
        },
    });
}

// Functions
