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

import {getService} from "./globalState";
import {SecurityTetraplet} from "./securityTetraplet";

export interface CallServiceResult {
    ret_code: number,
    result: string
}

export abstract class Service {
    serviceId: string;
    abstract call(fnName: string, args: any[], tetraplets: SecurityTetraplet[][]): CallServiceResult
}

/**
 * Creates one function for all function names.
 */
export class ServiceOne implements Service {

    serviceId: string;
    fn: (fnName: string, args: any[], tetraplets: SecurityTetraplet[][]) => object

    constructor(serviceId: string, fn: (fnName: string, args: any[]) => object) {
        this.serviceId = serviceId;
        this.fn = fn;
    }

    call(fnName: string, args: any[], tetraplets: SecurityTetraplet[][]): CallServiceResult {
        try {
            let result = this.fn(fnName, args, tetraplets)
            return {
                ret_code: 0,
                result: JSON.stringify(result)
            }
        } catch (err) {
            return {
                ret_code: 1,
                result: JSON.stringify(err)
            }
        }
    }

}

/**
 * Creates function per function name. Returns an error when call a name without registered function.
 */
export class ServiceMultiple implements Service {

    serviceId: string;
    functions: Map<string, (args: any[], tetraplets: SecurityTetraplet[][]) => object> = new Map();

    constructor(serviceId: string) {
        this.serviceId = serviceId;
    }

    registerFunction(fnName: string, fn: (args: any[], tetraplets: SecurityTetraplet[][]) => object) {
        this.functions.set(fnName, fn);
    }

    call(fnName: string, args: any[], tetraplets: SecurityTetraplet[][]): CallServiceResult {
        let fn = this.functions.get(fnName)
        if (fn) {
            try {
                let result = fn(args, tetraplets)
                return {
                    ret_code: 0,
                    result: JSON.stringify(result)
                }
            } catch (err) {
                return {
                    ret_code: 1,
                    result: JSON.stringify(err)
                }
            }

        } else {
            let errorMsg = `Error. There is no function ${fnName}`
            return {
                ret_code: 1,
                result: JSON.stringify(errorMsg)
            }
        }
    }
}

export function service(service_id: string, fn_name: string, args: string, tetraplets: string): CallServiceResult {
    try {
        let argsObject = JSON.parse(args)
        if (!Array.isArray(argsObject)) {
            throw new Error("args is not an array")
        }

        let tetrapletsObject: SecurityTetraplet[][] = JSON.parse(tetraplets)

        let service = getService(service_id)
        if (service) {
            return service.call(fn_name, argsObject, tetrapletsObject)
        } else {
            return {
                result: JSON.stringify(`Error. There is no service: ${service_id}`),
                ret_code: 0
            }
        }
    } catch (err) {
        console.error("Cannot parse arguments: " + JSON.stringify(err))
        return {
            result: JSON.stringify("Cannot parse arguments: " + JSON.stringify(err)),
            ret_code: 1
        }
    }

}
