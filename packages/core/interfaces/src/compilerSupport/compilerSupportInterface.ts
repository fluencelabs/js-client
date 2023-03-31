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
