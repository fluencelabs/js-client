import { IFluenceClient, ServiceDef } from '@fluencelabs/interfaces';
import { registerService } from '../../compilerSupport/registerService.js';

export const registerServiceImpl = (
    peer: IFluenceClient,
    def: ServiceDef,
    serviceId: string | undefined,
    service: any,
) => registerService({ peer, def, service, serviceId });
