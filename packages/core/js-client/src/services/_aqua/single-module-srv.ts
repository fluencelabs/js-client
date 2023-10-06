/**
 * Copyright 2023 Fluence Labs Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * This compiled aqua file was modified to make it work in monorepo
 */
import { CallParams, ServiceImpl } from '@fluencelabs/interfaces';

import { registerService } from "../../compilerSupport/registerService.js";
import { FluencePeer } from "../../jsPeer/FluencePeer.js";
import { Srv } from '../SingleModuleSrv.js';

// Services

export interface SrvDef {
    create: (
        wasm_b64_content: string,
        callParams: CallParams<"wasm_b64_content">,
    ) =>
        | { error: string | null; service_id: string | null; success: boolean }
        | Promise<{
              error: string | null;
              service_id: string | null;
              success: boolean;
          }>;
    list: (callParams: CallParams<null>) => string[] | Promise<string[]>;
    remove: (
        service_id: string,
        callParams: CallParams<"service_id">,
    ) =>
        | { error: string | null; success: boolean }
        | Promise<{ error: string | null; success: boolean }>;
}

export function registerSrv(
    peer: FluencePeer,
    serviceId: string,
    service: Srv,
) {
    registerService({
        peer,
        serviceId,
        // TODO: fix this after changing registerService signature
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        service: service as unknown as ServiceImpl,
        def: {
            defaultServiceId: "single_module_srv",
            functions: {
                tag: "labeledProduct",
                fields: {
                    create: {
                        tag: "arrow",
                        domain: {
                            tag: "labeledProduct",
                            fields: {
                                wasm_b64_content: {
                                    tag: "scalar",
                                    name: "string",
                                },
                            },
                        },
                        codomain: {
                            tag: "unlabeledProduct",
                            items: [
                                {
                                    tag: "struct",
                                    name: "ServiceCreationResult",
                                    fields: {
                                        error: {
                                            tag: "option",
                                            type: {
                                                tag: "scalar",
                                                name: "string",
                                            },
                                        },
                                        service_id: {
                                            tag: "option",
                                            type: {
                                                tag: "scalar",
                                                name: "string",
                                            },
                                        },
                                        success: {
                                            tag: "scalar",
                                            name: "bool",
                                        },
                                    },
                                },
                            ],
                        },
                    },
                    list: {
                        tag: "arrow",
                        domain: {
                            tag: "nil",
                        },
                        codomain: {
                            tag: "unlabeledProduct",
                            items: [
                                {
                                    tag: "array",
                                    type: {
                                        tag: "scalar",
                                        name: "string",
                                    },
                                },
                            ],
                        },
                    },
                    remove: {
                        tag: "arrow",
                        domain: {
                            tag: "labeledProduct",
                            fields: {
                                service_id: {
                                    tag: "scalar",
                                    name: "string",
                                },
                            },
                        },
                        codomain: {
                            tag: "unlabeledProduct",
                            items: [
                                {
                                    tag: "struct",
                                    name: "RemoveResult",
                                    fields: {
                                        error: {
                                            tag: "option",
                                            type: {
                                                tag: "scalar",
                                                name: "string",
                                            },
                                        },
                                        success: {
                                            tag: "scalar",
                                            name: "bool",
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
