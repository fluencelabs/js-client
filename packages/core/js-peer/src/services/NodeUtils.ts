import { CallParams, IFluenceInternalApi } from '@fluencelabs/interfaces';
import { defaultGuard } from './SingleModuleSrv.js';
import { NodeUtilsDef } from './_aqua/node-utils.js';
import { SecurityGuard } from './securityGuard.js';
import { readFile } from 'fs/promises';

export class NodeUtils implements NodeUtilsDef {
    constructor(private peer: IFluenceInternalApi) {
        this.securityGuard_readFile = defaultGuard(this.peer);
    }

    securityGuard_readFile: SecurityGuard<'path'>;

    async read_file(path: string, callParams: CallParams<'path'>) {
        if (!this.securityGuard_readFile(callParams)) {
            return {
                success: false,
                error: 'Security guard validation failed',
                content: null,
            };
        }

        try {
            // Strange enough, but Buffer type works here, while reading with encoding 'utf-8' doesn't
            const data: any = await readFile(path);
            return {
                success: true,
                content: data,
                error: null,
            };
        } catch (err: any) {
            return {
                success: false,
                error: err.message,
                content: null,
            };
        }
    }
}
