import {
    ArrowWithoutCallbacks,
    FnConfig,
    FunctionCallDef,
    NonArrowType,
    getArgumentTypes,
    isReturnTypeVoid,
    IFluenceClient,
} from '@fluencelabs/interface';

import {
    injectRelayService,
    registerParticleScopeService,
    responseService,
    errorHandlingService,
    ServiceDescription,
    userHandlerService,
    injectValueService,
} from './services.js';

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
export function callFunctionImpl(
    def: FunctionCallDef,
    script: string,
    config: FnConfig,
    peer: IFluenceClient,
    args: { [key: string]: any },
): Promise<unknown> {
    const argumentTypes = getArgumentTypes(def);

    const promise = new Promise((resolve, reject) => {
        const particle = peer.internals.createNewParticle(script, config?.ttl);

        if (particle instanceof Error) {
            return reject(particle.message);
        }

        for (let [name, argVal] of Object.entries(args)) {
            const type = argumentTypes[name];
            let service: ServiceDescription;
            if (type.tag === 'arrow') {
                service = userHandlerService(def.names.callbackSrv, [name, type], argVal);
            } else {
                service = injectValueService(def.names.getDataSrv, name, type, argVal);
            }
            registerParticleScopeService(peer, particle, service);
        }

        registerParticleScopeService(peer, particle, responseService(def, resolve));

        registerParticleScopeService(peer, particle, injectRelayService(def, peer));

        registerParticleScopeService(peer, particle, errorHandlingService(def, reject));

        peer.internals.initiateParticle(particle, (stage: any) => {
            // If function is void, then it's completed when one of the two conditions is met:
            //  1. The particle is sent to the network (state 'sent')
            //  2. All CallRequests are executed, e.g., all variable loading and local function calls are completed (state 'localWorkDone')
            if (isReturnTypeVoid(def) && (stage.stage === 'sent' || stage.stage === 'localWorkDone')) {
                resolve(undefined);
            }

            if (stage.stage === 'sendingError') {
                reject(`Could not send particle for ${def.functionName}: not connected  (particle id: ${particle.id})`);
            }

            if (stage.stage === 'expired') {
                reject(`Request timed out after ${particle.ttl} for ${def.functionName} (particle id: ${particle.id})`);
            }

            if (stage.stage === 'interpreterError') {
                reject(
                    `Script interpretation failed for ${def.functionName}: ${stage.errorMessage}  (particle id: ${particle.id})`,
                );
            }
        });
    });

    return promise;
}
