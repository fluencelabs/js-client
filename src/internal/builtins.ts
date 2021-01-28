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

import bs58 from 'bs58';
import { sendParticleAsFetch } from '../api';
import { Particle } from './particle';
import { FluenceClient } from '../FluenceClient';
import { ModuleConfig } from './moduleConfig';

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

    const res = await sendParticleAsFetch<any[]>(client, new Particle(script, data, ttl), '');
    return handleResponse(res);
};

/**
 * Get all available modules hosted on a connected relay.
 */
export const getModules = async (client: FluenceClient): Promise<string[]> => {
    const particle = new Particle(
        `
        (seq 
            (call __relay ("dist" "get_modules") [] result)
            (call myPeerId ("_callback" "getModules") [result])
        )
    `,
        {
            __relay: client.relayPeerId,
            myPeerId: client.selfPeerId,
        },
    );

    return sendParticleAsFetch(client, particle, 'getModules');
};

/**
 * Send a script to add module to a relay. Waiting for a response from a relay.
 * @param client
 * @param name
 * @param moduleBase64
 * @param config
 */
export const uploadModule = async (
    client: FluenceClient,
    name: string,
    moduleBase64: string,
    config?: ModuleConfig,
): Promise<string[]> => {
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

    let script = `
    (seq 
        (call __relay ("dist" "add_module") [module_bytes module_config] result)
        (call myPeerId ("_callback" "getModules") [result])

    )
    `;

    return sendParticleAsFetch(client, new Particle(script, data), 'result');
};

/**
 * Send a script to add module to a relay. Waiting for a response from a relay.
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
 * Send a script to create a service to a relay. Waiting for a response from a relay.
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
 * Get all available blueprints hosted on a connected relay.
 */
export const getBlueprints = async (client: FluenceClient, nodeId: string, ttl?: number): Promise<string[]> => {
    let returnValue = 'blueprints';
    let call = (nodeId: string) => `(call "${nodeId}" ("dist" "get_blueprints") [] ${returnValue})`;

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
 * Add a provider to DHT network to neighborhood around a key.
 */
export const addProvider = async (
    client: FluenceClient,
    key: Buffer,
    providerPeer: string,
    providerServiceId?: string,
    nodeId?: string,
    ttl?: number,
): Promise<void> => {
    let call = (nodeId: string) => `(call "${nodeId}" ("dht" "add_provider") [key provider] void[])`;

    key = bs58.encode(key) as any;

    let provider = {
        peer: providerPeer,
        service_id: providerServiceId,
    };

    let data = new Map();
    data.set('key', key);
    data.set('provider', provider);

    return requestResponse(client, 'addProvider', call, '', data, () => {}, nodeId, ttl);
};

/**
 * Get a provider from DHT network from neighborhood around a key..
 */
export const getProviders = async (client: FluenceClient, key: Buffer, nodeId?: string, ttl?: number): Promise<any> => {
    key = bs58.encode(key) as any;

    let returnValue = 'providers';
    let call = (nodeId: string) => `(call "${nodeId}" ("dht" "get_providers") [key] providers[])`;

    let data = new Map();
    data.set('key', key);

    return requestResponse(client, 'getProviders', call, returnValue, data, (args) => args[0], nodeId, ttl);
};

/**
 * Get relays neighborhood
 */
export const neighborhood = async (client: FluenceClient, node: string, ttl?: number): Promise<string[]> => {
    let returnValue = 'neighborhood';
    let call = (nodeId: string) => `(call "${nodeId}" ("dht" "neighborhood") [node] ${returnValue})`;

    let data = new Map();
    data.set('node', node);

    return requestResponse(client, 'neighborhood', call, returnValue, data, (args) => args[0] as string[], node, ttl);
};
