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

export type SimpleTypes =
    | ScalarType
    | OptionType
    | ArrayType
    | StructType
    | TopType
    | BottomType
    | NilType;

export type NonArrowType = SimpleTypes | ProductType;

export type TopType = {
    /**
     * Type descriptor. Used for pattern-matching
     */
    tag: "topType";
};

export type BottomType = {
    /**
     * Type descriptor. Used for pattern-matching
     */
    tag: "bottomType";
};

export type OptionType = {
    /**
     * Type descriptor. Used for pattern-matching
     */
    tag: "option";

    /**
     * Underlying type of the option
     */
    type: SimpleTypes;
};

export type NilType = {
    /**
     * Type descriptor. Used for pattern-matching
     */
    tag: "nil";
};

export type ArrayType = {
    /**
     * Type descriptor. Used for pattern-matching
     */
    tag: "array";

    /**
     * Type of array elements
     */
    type: SimpleTypes;
};

/**
 * All possible scalar type names
 */
export type ScalarNames =
    | "u8"
    | "u16"
    | "u32"
    | "u64"
    | "i8"
    | "i16"
    | "i32"
    | "i64"
    | "f32"
    | "f64"
    | "bool"
    | "string";

export type ScalarType = {
    /**
     * Type descriptor. Used for pattern-matching
     */
    tag: "scalar";

    /**
     * Name of the scalar type
     */
    name: ScalarNames;
};

export type StructType = {
    /**
     * Type descriptor. Used for pattern-matching
     */
    tag: "struct";

    /**
     * Struct name
     */
    name: string;

    /**
     * Struct fields
     */
    fields: { [key: string]: SimpleTypes };
};

export type LabeledProductType<
    T extends
        | SimpleTypes
        | ArrowType<LabeledProductType<SimpleTypes> | UnlabeledProductType> =
        | SimpleTypes
        | ArrowType<LabeledProductType<SimpleTypes> | UnlabeledProductType>,
    K extends { [key: string]: T } = { [key: string]: T },
> = {
    /**
     * Type descriptor. Used for pattern-matching
     */
    tag: "labeledProduct";

    /**
     * Labelled product fields
     */
    fields: K;
};

export type UnlabeledProductType<T extends Array<SimpleTypes> = SimpleTypes[]> =
    {
        /**
         * Type descriptor. Used for pattern-matching
         */
        tag: "unlabeledProduct";

        /**
         * Items in unlabelled product
         */
        items: T;
    };

export type ProductType = UnlabeledProductType | LabeledProductType;

/**
 * ArrowType is a profunctor pointing its domain to codomain.
 * Profunctor means variance: Arrow is contravariant on domain, and variant on codomain.
 */
export type ArrowType<T extends LabeledProductType | UnlabeledProductType> = {
    /**
     * Type descriptor. Used for pattern-matching
     */
    tag: "arrow";

    /**
     * Where this Arrow is defined
     */
    domain: T | NilType;

    /**
     * Where this Arrow points to
     */
    codomain: UnlabeledProductType | NilType;
};

/**
 * Arrow which domain contains only non-arrow types
 */
export type ArrowWithoutCallbacks = ArrowType<
    UnlabeledProductType | LabeledProductType<SimpleTypes>
>;

/**
 * Arrow which domain does can contain both non-arrow types and arrows (which themselves cannot contain arrows)
 */
export type ArrowWithCallbacks = ArrowType<LabeledProductType>;

export interface FunctionCallConstants {
    /**
     * The name of the relay variable
     */
    relay: string;

    /**
     * The name of the serviceId used load variables at the beginning of the script
     */
    getDataSrv: string;

    /**
     * The name of serviceId is used to execute callbacks for the current particle
     */
    callbackSrv: string;

    /**
     * The name of the serviceId which is called to propagate return value to the generated function caller
     */
    responseSrv: string;

    /**
     * The name of the functionName which is called to propagate return value to the generated function caller
     */
    responseFnName: string;

    /**
     * The name of the serviceId which is called to report errors to the generated function caller
     */
    errorHandlingSrv: string;

    /**
     * The name of the functionName which is called to report errors to the generated function caller
     */
    errorFnName: string;
}

/**
 * Definition of function (`func` instruction) generated by the Aqua compiler
 */
export interface FunctionCallDef {
    /**
     * The name of the function in Aqua language
     */
    functionName: string;

    /**
     * Underlying arrow which represents function in aqua
     */
    arrow: ArrowType<
        LabeledProductType<SimpleTypes | ArrowType<UnlabeledProductType>>
    >;

    /**
     * Names of the different entities used in generated air script
     */
    names: FunctionCallConstants;
}

/**
 * Definition of service registration function (`service` instruction) generated by the Aqua compiler
 */
export interface ServiceDef {
    /**
     * Default service id. If the service has no default id the value should be undefined
     */
    defaultServiceId?: string;

    /**
     * List of functions which the service consists of
     */
    functions:
        | LabeledProductType<ArrowType<LabeledProductType<SimpleTypes>>>
        | NilType;
}

/**
 * Options to configure Aqua function execution
 */
export interface FnConfig {
    /**
     * Sets the TTL (time to live) for particle responsible for the function execution
     * If the option is not set the default TTL from FluencePeer config is used
     */
    ttl?: number;
}

export const getArgumentTypes = (
    def: FunctionCallDef,
): {
    [key: string]: NonArrowType | ArrowWithoutCallbacks;
} => {
    if (def.arrow.domain.tag !== "labeledProduct") {
        throw new Error("Should be impossible");
    }

    return def.arrow.domain.fields;
};

export const isReturnTypeVoid = (def: FunctionCallDef): boolean => {
    if (def.arrow.codomain.tag === "nil") {
        return true;
    }

    return def.arrow.codomain.items.length === 0;
};
