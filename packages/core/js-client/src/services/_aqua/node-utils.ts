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
import { CallParams, IFluenceInternalApi } from "@fluencelabs/interfaces";

import { registerService } from "../../compilerSupport/registerService.js";

// Services

export interface NodeUtilsDef {
    read_file: (
        path: string,
        callParams: CallParams<"path">,
    ) =>
        | { content: string | null; error: string | null; success: boolean }
        | Promise<{
              content: string | null;
              error: string | null;
              success: boolean;
          }>;
}

export function registerNodeUtils(
    peer: IFluenceInternalApi,
    serviceId: string,
    service: any,
) {
    registerService({
        peer,
        service,
        serviceId,
        def: {
            defaultServiceId: "node_utils",
            functions: {
                tag: "labeledProduct",
                fields: {
                    read_file: {
                        tag: "arrow",
                        domain: {
                            tag: "labeledProduct",
                            fields: {
                                path: {
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
                                    name: "ReadFileResult",
                                    fields: {
                                        content: {
                                            tag: "option",
                                            type: {
                                                tag: "scalar",
                                                name: "string",
                                            },
                                        },
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
