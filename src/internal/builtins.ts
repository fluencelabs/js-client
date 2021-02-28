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

import { RequestFlow } from './RequestFlow';
import { FluenceClient } from '../FluenceClient';
import { ModuleConfig } from './moduleConfig';
import { RequestFlowBuilder } from './RequestFlowBuilder';

const nodeIdentityCall = (client: FluenceClient): string => {
    return `(call "${client.relayPeerId}" ("op" "identity") [])`;
};

const requestResponse = async <T>(
    client: FluenceClient,
    name: string,
    call: (nodeId: string) => string,
    returnValue: string,
    data: Map<string, any>,
    handleResponse: (args: any[]) => T,
    nodeId?: string,
    ttl?: number,
): Promise<T> => {
    if (!ttl) {
        ttl = 10000;
    }

    if (!nodeId) {
        nodeId = client.relayPeerId;
    }

    let serviceCall = call(nodeId);

    let script = `(seq
        ${nodeIdentityCall(client)}
        (seq 
            (seq          
                ${serviceCall}
                ${nodeIdentityCall(client)}
            )
            (call "${client.selfPeerId}" ("_callback" "${name}") [${returnValue}])
        )
    )
    `;

    const [request, promise] = new RequestFlowBuilder()
        .withRawScript(script)
        .withVariables(data)
        .withTTL(ttl)
        .buildWithFetchSemantics<any[]>('_callback', name);
    await client.initiateFlow(request);
    const res = await promise;
    return handleResponse(res);
};

/**
 * Get all available modules hosted on a connected relay. @deprecated prefer using raw Particles instead
 * @param { FluenceClient } client - The Fluence Client instance.
 * @returns { Array<string> } - list of available modules on the connected relay
 */
export const getModules = async (client: FluenceClient, ttl?: number): Promise<string[]> => {
    let callbackFn = 'getModules';
    const [req, promise] = new RequestFlowBuilder()
        .withRawScript(
            `
        (seq 
            (call __relay ("dist" "list_modules") [] result)
            (call myPeerId ("_callback" "${callbackFn}") [result])
        )
    `,
        )
        .withVariables({
            __relay: client.relayPeerId,
            myPeerId: client.selfPeerId,
        })
        .withTTL(ttl)
        .buildWithFetchSemantics<[string[]]>('_callback', callbackFn);
    client.initiateFlow(req);

    const [res] = await promise;
    return res;
};

/**
 * Get all available interfaces hosted on a connected relay. @deprecated prefer using raw Particles instead
 * @param { FluenceClient } client - The Fluence Client instance.
 * @returns { Array<string> } - list of available interfaces on the connected relay
 */
export const getInterfaces = async (client: FluenceClient, ttl?: number): Promise<string[]> => {
    let callbackFn = 'getInterfaces';
    const [req, promise] = new RequestFlowBuilder()
        .withRawScript(
            `
            (seq
                (seq
                    (seq
                        (call relay ("srv" "list") [] services)
                        (call relay ("op" "identity") [] interfaces[])
                    )
                    (fold services s
                        (seq
                            (call relay ("srv" "get_interface") [s.$.id!] interfaces[])
                            (next s)
                        )
                    )
                )
                (call myPeerId ("_callback" "${callbackFn}") [interfaces])
            )
        `,
        )
        .withVariables({
            relay: client.relayPeerId,
            myPeerId: client.selfPeerId,
        })
        .withTTL(ttl)
        .buildWithFetchSemantics<[string[]]>('_callback', callbackFn);

    client.initiateFlow(req);

    const [res] = await promise;
    return res;
};

/**
 * Send a script to add module to a relay. Waiting for a response from a relay. @deprecated prefer using raw Particles instead
 * @param { FluenceClient } client - The Fluence Client instance.
 * @param { string } name - Name of the uploaded module
 * @param { string } moduleBase64 - Base64 content of the module
 * @param { ModuleConfig } config - Module config
 */
export const uploadModule = async (
    client: FluenceClient,
    name: string,
    moduleBase64: string,
    config?: ModuleConfig,
    ttl?: number,
): Promise<void> => {
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
    data.set('myPeerId', client.selfPeerId);

    const [req, promise] = new RequestFlowBuilder()
        .withRawScript(
            `
    (seq 
        (call __relay ("dist" "add_module") [module_bytes module_config] result)
        (call myPeerId ("_callback" "getModules") [result])

    )
    `,
        )
        .withVariables(data)
        .withTTL(ttl)
        .buildWithFetchSemantics<[string[]]>('_callback', 'getModules');

    await client.initiateFlow(req);
    await promise;
};

/**
 * Send a script to add module to a relay. Waiting for a response from a relay. @deprecated prefer using raw Particles instead
 * @param { FluenceClient } client - The Fluence Client instance.
 * @param { string } name - Name of the blueprint
 * @param { Array<string> } dependencies - Array of it's dependencies
 * @param {[string]} blueprintId - Optional blueprint ID
 * @param {[string]} nodeId - Optional node peer id to deploy blueprint to
 * @param {[number]} ttl - Optional ttl for the particle which does the job
 * @returns { string } - Created blueprint ID
 */
export const addBlueprint = async (
    client: FluenceClient,
    name: string,
    dependencies: string[],
    blueprintId?: string,
    nodeId?: string,
    ttl?: number,
): Promise<string> => {
    let returnValue = 'blueprint_id';
    let call = (nodeId: string) => `(call "${nodeId}" ("dist" "add_blueprint") [blueprint] ${returnValue})`;

    let data = new Map();
    data.set('blueprint', { name: name, dependencies: dependencies, id: blueprintId });

    return requestResponse(
        client,
        'addBlueprint',
        call,
        returnValue,
        data,
        (args: any[]) => args[0] as string,
        nodeId,
        ttl,
    );
};

/**
 * Send a script to create a service on the connected relay. Waiting for a response from the relay. @deprecated prefer using raw Particles instead
 * @param { FluenceClient } client - The Fluence Client instance.
 * @param {string} blueprintId - The blueprint of the service
 * @param {[string]} nodeId - Optional node peer id to deploy service to
 * @param {[number]} ttl - Optional ttl for the particle which does the job
 * @returns { string } - Created service ID
 */
export const createService = async (
    client: FluenceClient,
    blueprintId: string,
    nodeId?: string,
    ttl?: number,
): Promise<string> => {
    let returnValue = 'service_id';
    let call = (nodeId: string) => `(call "${nodeId}" ("srv" "create") [blueprint_id] ${returnValue})`;

    let data = new Map();
    data.set('blueprint_id', blueprintId);

    return requestResponse(
        client,
        'createService',
        call,
        returnValue,
        data,
        (args: any[]) => args[0] as string,
        nodeId,
        ttl,
    );
};

/**
 * Get all available blueprints hosted on a connected relay. @deprecated prefer using raw Particles instead
 * @param { FluenceClient } client - The Fluence Client instance.
 * @param {[string]} nodeId - Optional node peer id to get available blueprints from
 * @param {[string]} nodeId - Optional node peer id to deploy service to
 * @param {[number]} ttl - Optional ttl for the particle which does the job
 * @returns { Array<string> } - List of available blueprints
 */
export const getBlueprints = async (client: FluenceClient, nodeId?: string, ttl?: number): Promise<string[]> => {
    let returnValue = 'blueprints';
    let call = (nodeId: string) => `(call "${nodeId}" ("dist" "list_blueprints") [] ${returnValue})`;

    return requestResponse(
        client,
        'getBlueprints',
        call,
        returnValue,
        new Map(),
        (args: any[]) => args[0] as string[],
        nodeId,
        ttl,
    );
};

/**
 * Get relays neighborhood. @deprecated prefer using raw Particles instead
 * @param { FluenceClient } client - The Fluence Client instance.
 * @param {[string]} nodeId - Optional node peer id to get neighborhood from
 * @param {[number]} ttl - Optional ttl for the particle which does the job
 * @returns { Array<string> } - List of peer ids of neighbors of the node
 */
export const neighborhood = async (client: FluenceClient, nodeId?: string, ttl?: number): Promise<string[]> => {
    let returnValue = 'neighborhood';
    let call = (nodeId: string) => `(call "${nodeId}" ("dht" "neighborhood") [node] ${returnValue})`;

    let data = new Map();
    if (nodeId) data.set('node', nodeId);

    return requestResponse(client, 'neighborhood', call, returnValue, data, (args) => args[0] as string[], nodeId, ttl);
};

/**
 * Upload an AIR script, that will be runned in a loop on a node. @deprecated prefer using raw Particles instead
 * @param { FluenceClient } client - The Fluence Client instance.
 * @param {[string]} script - script to upload
 * @param period how often start script processing, in seconds
 * @param {[string]} nodeId - Optional node peer id to get neighborhood from
 * @param {[number]} ttl - Optional ttl for the particle which does the job
 * @returns {[string]} - script id
 */
export const addScript = async (
    client: FluenceClient,
    script: string,
    period?: number,
    nodeId?: string,
    ttl?: number,
): Promise<string> => {
    let returnValue = 'id';
    let periodV = '';
    if (period) periodV = period.toString();
    let call = (nodeId: string) => `(call "${nodeId}" ("script" "add") [script ${periodV}] ${returnValue})`;

    let data = new Map();
    data.set('script', script);
    if (period) data.set('period', period);

    return requestResponse(client, 'addScript', call, returnValue, data, (args) => args[0] as string, nodeId, ttl);
};

/**
 * Remove an AIR script from a node. @deprecated prefer using raw Particles instead
 * @param { FluenceClient } client - The Fluence Client instance.
 * @param {[string]} id - id of a script
 * @param {[string]} nodeId - Optional node peer id to get neighborhood from
 * @param {[number]} ttl - Optional ttl for the particle which does the job
 */
export const removeScript = async (client: FluenceClient, id: string, nodeId?: string, ttl?: number): Promise<void> => {
    let returnValue = 'empty';
    let call = (nodeId: string) => `(call "${nodeId}" ("script" "remove") [script_id] ${returnValue})`;

    let data = new Map();
    data.set('script_id', id);

    return requestResponse(client, 'removeScript', call, returnValue, data, (args) => {}, nodeId, ttl);
};
