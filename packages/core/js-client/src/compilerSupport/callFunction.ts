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

import {
    CallAquaFunctionType,
    getArgumentTypes,
    isReturnTypeVoid,
} from "@fluencelabs/interfaces";

import { logger } from "../util/logger.js";

import {
    errorHandlingService,
    injectRelayService,
    injectValueService,
    registerParticleScopeService,
    responseService,
    ServiceDescription,
    userHandlerService,
} from "./services.js";

const log = logger("aqua");

/**
 * Convenience function which does all the internal work of creating particles
 * and making necessary service registrations in order to support Aqua function calls
 *
 * @param def - function definition generated by the Aqua compiler
 * @param script - air script with function execution logic generated by the Aqua compiler
 * @param config - options to configure Aqua function execution
 * @param peer - Fluence Peer to invoke the function at
 * @param args - args in the form of JSON where each key corresponds to the name of the argument
 * @returns
 */
export const callAquaFunction: CallAquaFunctionType = async ({
    def,
    script,
    config,
    peer,
    args,
}) => {
    log.trace("calling aqua function %j", { def, script, config, args });
    const argumentTypes = getArgumentTypes(def);

    const particle = await peer.internals.createNewParticle(
        script,
        config?.ttl,
    );

    return new Promise((resolve, reject) => {
        if (particle instanceof Error) {
            return reject(particle.message);
        }

        for (const [name, argVal] of Object.entries(args)) {
            const type = argumentTypes[name];
            let service: ServiceDescription;

            if (type.tag === "arrow") {
                service = userHandlerService(
                    def.names.callbackSrv,
                    [name, type],
                    argVal,
                );
            } else {
                service = injectValueService(
                    def.names.getDataSrv,
                    name,
                    type,
                    argVal,
                );
            }

            registerParticleScopeService(peer, particle, service);
        }

        registerParticleScopeService(
            peer,
            particle,
            responseService(def, resolve),
        );

        registerParticleScopeService(
            peer,
            particle,
            injectRelayService(def, peer),
        );

        registerParticleScopeService(
            peer,
            particle,
            errorHandlingService(def, reject),
        );

        peer.internals.initiateParticle(particle, (stage: any) => {
            // If function is void, then it's completed when one of the two conditions is met:
            //  1. The particle is sent to the network (state 'sent')
            //  2. All CallRequests are executed, e.g., all variable loading and local function calls are completed (state 'localWorkDone')
            if (
                isReturnTypeVoid(def) &&
                (stage.stage === "sent" || stage.stage === "localWorkDone")
            ) {
                resolve(undefined);
            }

            if (stage.stage === "sendingError") {
                reject(
                    `Could not send particle for ${def.functionName}: not connected  (particle id: ${particle.id})`,
                );
            }

            if (stage.stage === "expired") {
                reject(
                    `Particle expired after ttl of ${particle.ttl}ms for function ${def.functionName} (particle id: ${particle.id})`,
                );
            }

            if (stage.stage === "interpreterError") {
                reject(
                    `Script interpretation failed for ${def.functionName}: ${stage.errorMessage}  (particle id: ${particle.id})`,
                );
            }
        });
    });
};
