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
import type { RegisterServiceType } from '@fluencelabs/interfaces';
import { registerGlobalService, userHandlerService } from './services.js';

import { logger } from '../util/logger.js';

const log = logger('aqua');

export const registerService: RegisterServiceType = ({ peer, def, serviceId, service }) => {
    log.trace('registering aqua service %o', { def, serviceId, service });

    // Checking for missing keys
    const requiredKeys = def.functions.tag === 'nil' ? [] : Object.keys(def.functions.fields);
    const incorrectServiceDefinitions = requiredKeys.filter((f) => !(f in service));
    if (!!incorrectServiceDefinitions.length) {
        throw new Error(
            `Error registering service ${serviceId}: missing functions: ` +
                incorrectServiceDefinitions.map((d) => "'" + d + "'").join(', '),
        );
    }

    if (!serviceId) {
        serviceId = def.defaultServiceId;
    }

    if (!serviceId) {
        throw new Error('Service ID must be specified');
    }

    const singleFunctions = def.functions.tag === 'nil' ? [] : Object.entries(def.functions.fields);
    for (let singleFunction of singleFunctions) {
        let [name, type] = singleFunction;
        // The function has type of (arg1, arg2, arg3, ... , callParams) => CallServiceResultType | void
        // Account for the fact that user service might be defined as a class - .bind(...)
        const userDefinedHandler = service[name].bind(service);

        const serviceDescription = userHandlerService(serviceId, singleFunction, userDefinedHandler);
        registerGlobalService(peer, serviceDescription);
    }
    log.trace('aqua service registered %s', serviceId);
};
