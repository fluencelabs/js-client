import { IFluenceInternalApi } from '../fluenceClient.js';
import { FnConfig, FunctionCallDef, ServiceDef } from './aquaTypeDefinitions.js';

export interface CallAquaFunctionArgs {
    peer: IFluenceInternalApi;
    def: FunctionCallDef;
    script: string;
    config: FnConfig;
    args: { [key: string]: any };
}

export type CallAquaFunction = (args: CallAquaFunctionArgs) => Promise<unknown>;

export interface RegisterServiceArgs {
    peer: IFluenceInternalApi;
    def: ServiceDef;
    serviceId: string | undefined;
    service: any;
}

export type RegisterService = (args: RegisterServiceArgs) => void;
