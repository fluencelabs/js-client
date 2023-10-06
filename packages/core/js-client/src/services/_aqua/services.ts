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
import { CallParams, ServiceImpl } from "@fluencelabs/interfaces";

import { registerService } from "../../compilerSupport/registerService.js";
import { FluencePeer } from "../../jsPeer/FluencePeer.js";
import { Sig } from "../Sig.js";

// Services

export interface SigDef {
    get_peer_id: (callParams: CallParams<null>) => string | Promise<string>;
    sign: (
        data: number[],
        callParams: CallParams<"data">,
    ) =>
        | { error: string | null; signature: number[] | null; success: boolean }
        | Promise<{
              error: string | null;
              signature: number[] | null;
              success: boolean;
          }>;
    verify: (
        signature: number[],
        data: number[],
        callParams: CallParams<"signature" | "data">,
    ) => boolean | Promise<boolean>;
}

export function registerSig(
    peer: FluencePeer,
    serviceId: string,
    service: Sig,
) {
    registerService({
        peer,
        // TODO: fix this after changing registerService signature
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        service: service as unknown as ServiceImpl,
        serviceId,
        def: {
            defaultServiceId: "sig",
            functions: {
                tag: "labeledProduct",
                fields: {
                    get_peer_id: {
                        tag: "arrow",
                        domain: {
                            tag: "nil",
                        },
                        codomain: {
                            tag: "unlabeledProduct",
                            items: [
                                {
                                    tag: "scalar",
                                    name: "string",
                                },
                            ],
                        },
                    },
                    sign: {
                        tag: "arrow",
                        domain: {
                            tag: "labeledProduct",
                            fields: {
                                data: {
                                    tag: "array",
                                    type: {
                                        tag: "scalar",
                                        name: "u8",
                                    },
                                },
                            },
                        },
                        codomain: {
                            tag: "unlabeledProduct",
                            items: [
                                {
                                    tag: "struct",
                                    name: "SignResult",
                                    fields: {
                                        error: {
                                            tag: "option",
                                            type: {
                                                tag: "scalar",
                                                name: "string",
                                            },
                                        },
                                        signature: {
                                            tag: "option",
                                            type: {
                                                tag: "array",
                                                type: {
                                                    tag: "scalar",
                                                    name: "u8",
                                                },
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
                    verify: {
                        tag: "arrow",
                        domain: {
                            tag: "labeledProduct",
                            fields: {
                                signature: {
                                    tag: "array",
                                    type: {
                                        tag: "scalar",
                                        name: "u8",
                                    },
                                },
                                data: {
                                    tag: "array",
                                    type: {
                                        tag: "scalar",
                                        name: "u8",
                                    },
                                },
                            },
                        },
                        codomain: {
                            tag: "unlabeledProduct",
                            items: [
                                {
                                    tag: "scalar",
                                    name: "bool",
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
