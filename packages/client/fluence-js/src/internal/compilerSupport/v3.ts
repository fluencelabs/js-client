/*
 * Copyright 2022 Fluence Labs Limited
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

import { FluencePeer } from '@fluencelabs/js-peer/dist/FluencePeer';
import { FnConfig, FunctionCallDef, ServiceDef } from '@fluencelabs/js-peer/dist/compilerSupport/interface';
import { registerServiceImpl } from '@fluencelabs/js-peer/dist/compilerSupport/registerService';
import { callFunctionImpl, getArgumentTypes } from '@fluencelabs/js-peer/dist/compilerSupport/callFunction';

import { getDefaultPeer } from './util';

export { FluencePeer } from '@fluencelabs/js-peer/dist/FluencePeer';
export { CallParams } from '@fluencelabs/js-peer/dist/commonTypes';
export {
    ArrayType,
    ArrowType,
    ArrowWithCallbacks,
    ArrowWithoutCallbacks,
    BottomType,
    FnConfig,
    FunctionCallConstants,
    FunctionCallDef,
    LabeledProductType,
    NilType,
    NonArrowType,
    OptionType,
    ProductType,
    ScalarNames,
    ScalarType,
    ServiceDef,
    StructType,
    TopType,
    UnlabeledProductType,
} from '@fluencelabs/js-peer/dist/compilerSupport/interface';
export { callFunctionImpl } from '@fluencelabs/js-peer/dist/compilerSupport/callFunction';
export { registerServiceImpl } from '@fluencelabs/js-peer/dist/compilerSupport/registerService';

/**
 * Convenience function to support Aqua `func` generation backend
 * The compiler only need to generate a call the function and provide the corresponding definitions and the air script
 *
 * @param rawFnArgs - raw arguments passed by user to the generated function
 * @param def - function definition generated by the Aqua compiler
 * @param script - air script with function execution logic generated by the Aqua compiler
 */
export const callFunction = (rawFnArgs: Array<any>, def: FunctionCallDef, script: string) => {
    const { args, peer, config } = extractFunctionArgs(rawFnArgs, def);
    return callFunctionImpl(def, script, config || {}, peer, args);
};

/**
 * Convenience function to support Aqua `service` generation backend
 * The compiler only need to generate a call the function and provide the corresponding definitions and the air script
 *
 * @param args - raw arguments passed by user to the generated function
 * @param def - service definition generated by the Aqua compiler
 */
export function registerService(args: any[], def: ServiceDef) {
    const { peer, service, serviceId } = extractServiceArgs(args, def.defaultServiceId);

    return registerServiceImpl(peer, def, serviceId, service);
}

/**
 * Arguments could be passed in one these configurations:
 * [...actualArgs]
 * [peer, ...actualArgs]
 * [...actualArgs, config]
 * [peer, ...actualArgs, config]
 *
 * This function select the appropriate configuration and returns
 * arguments in a structured way of: { peer, config, args }
 */
const extractFunctionArgs = (
    args: any[],
    def: FunctionCallDef,
): {
    peer: FluencePeer;
    config?: FnConfig;
    args: { [key: string]: any };
} => {
    const argumentTypes = getArgumentTypes(def);
    const argumentNames = Object.keys(argumentTypes);
    const numberOfExpectedArgs = argumentNames.length;

    let peer: FluencePeer;
    let structuredArgs: any[];
    let config: FnConfig;
    if (FluencePeer.isInstance(args[0])) {
        peer = args[0];
        structuredArgs = args.slice(1, numberOfExpectedArgs + 1);
        config = args[numberOfExpectedArgs + 1];
    } else {
        peer = getDefaultPeer();
        structuredArgs = args.slice(0, numberOfExpectedArgs);
        config = args[numberOfExpectedArgs];
    }

    if (structuredArgs.length !== numberOfExpectedArgs) {
        throw new Error(`Incorrect number of arguments. Expecting ${numberOfExpectedArgs}`);
    }

    const argsRes = argumentNames.reduce((acc, name, index) => ({ ...acc, [name]: structuredArgs[index] }), {});

    return {
        peer: peer,
        config: config,
        args: argsRes,
    };
};

/**
 * Arguments could be passed in one these configurations:
 * [serviceObject]
 * [peer, serviceObject]
 * [defaultId, serviceObject]
 * [peer, defaultId, serviceObject]
 *
 * Where serviceObject is the raw object with function definitions passed by user
 *
 * This function select the appropriate configuration and returns
 * arguments in a structured way of: { peer, serviceId, service }
 */
const extractServiceArgs = (
    args: any[],
    defaultServiceId?: string,
): { peer: FluencePeer; serviceId: string; service: any } => {
    let peer: FluencePeer;
    let serviceId: any;
    let service: any;
    if (FluencePeer.isInstance(args[0])) {
        peer = args[0];
    } else {
        peer = getDefaultPeer();
    }

    if (typeof args[0] === 'string') {
        serviceId = args[0];
    } else if (typeof args[1] === 'string') {
        serviceId = args[1];
    } else {
        serviceId = defaultServiceId;
    }

    // Figuring out which overload is the service.
    // If the first argument is not Fluence Peer and it is an object, then it can only be the service def
    // If the first argument is peer, we are checking further. The second argument might either be
    // an object, that it must be the service object
    // or a string, which is the service id. In that case the service is the third argument
    if (!FluencePeer.isInstance(args[0]) && typeof args[0] === 'object') {
        service = args[0];
    } else if (typeof args[1] === 'object') {
        service = args[1];
    } else {
        service = args[2];
    }

    return {
        peer: peer,
        serviceId: serviceId,
        service: service,
    };
};
