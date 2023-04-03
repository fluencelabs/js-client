/*
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
import { IFluenceInternalApi } from '../fluenceClient.js';
import { FnConfig, FunctionCallDef, ServiceDef } from './aquaTypeDefinitions.js';

/**
 * Arguments passed to Aqua function
 */
export type PassedArgs = { [key: string]: any };

/**
 * Arguments for callAquaFunction function
 */
export interface CallAquaFunctionArgs {
    /**
     * Peer to call the function on
     */
    peer: IFluenceInternalApi;

    /**
     * Function definition
     */
    def: FunctionCallDef;

    /**
     * Air script used by the aqua function
     */
    script: string;

    /**
     * Function configuration
     */
    config: FnConfig;

    /**
     * Arguments to pass to the function
     */
    args: PassedArgs;
}

/**
 * Call a function from Aqua script
 */
export type CallAquaFunctionType = (args: CallAquaFunctionArgs) => Promise<unknown>;

/**
 * Arguments for registerService function
 */
export interface RegisterServiceArgs {
    /**
     * Peer to register the service on
     */
    peer: IFluenceInternalApi;

    /**
     * Service definition
     */
    def: ServiceDef;

    /**
     * Service id
     */
    serviceId: string | undefined;

    /**
     * Service implementation
     */
    service: any;
}

/**
 * Register a service defined in Aqua on a Fluence peer
 */
export type RegisterServiceType = (args: RegisterServiceArgs) => void;
