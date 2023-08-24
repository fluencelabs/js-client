/**
 * This compiled aqua file was modified to make it work in monorepo
 */
import { CallParams, IFluenceInternalApi } from '@fluencelabs/interfaces';
import { registerService } from '../../compilerSupport/registerService.js';

// Services

export interface TracingDef {
    tracingEvent: (
        arrowName: string,
        event: string,
        callParams: CallParams<'arrowName' | 'event'>,
    ) => void | Promise<void>;
}

export function registerTracing(peer: IFluenceInternalApi, serviceId: string, service: any) {
    registerService({
        peer,
        serviceId,
        service,
        def: {
            defaultServiceId: 'tracingSrv',
            functions: {
                tag: 'labeledProduct',
                fields: {
                    tracingEvent: {
                        tag: 'arrow',
                        domain: {
                            tag: 'labeledProduct',
                            fields: {
                                arrowName: {
                                    tag: 'scalar',
                                    name: 'string',
                                },
                                event: {
                                    tag: 'scalar',
                                    name: 'string',
                                },
                            },
                        },
                        codomain: {
                            tag: 'nil',
                        },
                    },
                },
            },
        },
    });
}

// Functions
