/*
 * Copyright 2020 Fluence Labs Limited
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

import {FluenceClient} from "../FluenceClient";
import {ModuleConfig} from "./moduleConfig";

export const getModules = async (client: FluenceClient): Promise<string[]> => {

    let script = `
        (call __relay ("dist" "get_modules") [] result)
    `;

    const data = new Map();
    data.set('__relay', client.relayPeerId);

    return await client.fetch(script, ["result"], data);
};

export const uploadModule = async (client: FluenceClient, name: string,
                                   moduleBase64: string,
                                   config?: ModuleConfig): Promise<string[]> => {

    if (!config) {
        config = {
            name: name,
            mem_pages_count: 100,
            logger_enabled: true,
            wasi: {
                envs: {},
                preopened_files: ['/tmp'],
                mapped_dirs: {},
            },
        };
    }

    let data = new Map();
    data.set('module_bytes', moduleBase64);
    data.set('module_config', config);
    data.set('__relay', client.relayPeerId);

    let script = `
        (call __relay ("dist" "add_module") [module_bytes module_config] result)
    `;

    return await client.fetch(script, ["result"], data);
};