type SomeNonArrowTypes = NilType | ScalarType | OptionType | ArrayType | StructType;

export type NonArrowType = SomeNonArrowTypes | ProductType<SomeNonArrowTypes>;

export type OptionType = {
    /**
     * Type descriptor. Used for pattern-matching
     */
    tag: 'option';

    type: NonArrowType;
};

export type NilType = {
    /**
     * Type descriptor. Used for pattern-matching
     */
    tag: 'nil';
};

export type ArrayType = {
    /**
     * Type descriptor. Used for pattern-matching
     */
    tag: 'array';

    type: NonArrowType;
};

export type ScalarNames =
    | 'u8'
    | 'u16'
    | 'u32'
    | 'u64'
    | 'i8'
    | 'i16'
    | 'i32'
    | 'i64'
    | 'f32'
    | 'f64'
    | 'bool'
    | 'string';

export type ScalarType = {
    /**
     * Type descriptor. Used for pattern-matching
     */
    tag: 'scalar';
    name: ScalarNames;
};

export type StructType = {
    tag: 'struct';
    name: string;

    fields: Array<[string, NonArrowType]>;
};

export type LabeledProductType<T> = {
    /**
     * Type descriptor. Used for pattern-matching
     */
    tag: 'labeledProduct';

    fields: Array<[string, T]>;
};

export type UnlabeledProductType<T> = {
    /**
     * Type descriptor. Used for pattern-matching
     */
    tag: 'unlabeledProduct';

    items: Array<T>;
};

export type ProductType<T> = UnlabeledProductType<T> | LabeledProductType<T>;

export type ArrowType<T> = {
    /**
     * Type descriptor. Used for pattern-matching
     */
    tag: 'arrow';

    domain: ProductType<T>;

    codomain: UnlabeledProductType<NonArrowType>;
};

export type ArrowWithoutCallbacks = ArrowType<NonArrowType>;

export type ArrowWithCallbacks = ArrowType<NonArrowType | ArrowWithoutCallbacks>;

/**
 * Definition of function (`func` instruction) generated by the Aqua compiler
 */
export interface FunctionCallDef {
    /**
     * The name of the function in Aqua language
     */
    functionName: string;

    arrow: ArrowWithCallbacks;

    /**
     * Names of the different entities used in generated air script
     */
    names: {
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
    };
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
    functions: LabeledProductType<ArrowWithoutCallbacks>;
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
