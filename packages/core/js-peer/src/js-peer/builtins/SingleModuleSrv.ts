import { v4 as uuidv4 } from 'uuid';
import { SrvDef } from '../_aqua/single-module-srv.js';
import { NodeUtilsDef } from '../_aqua/node-utils.js';
import { FluencePeer } from '../FluencePeer.js';
import { CallParams } from '@fluencelabs/interfaces';
import { Buffer } from 'buffer';
import { allowOnlyParticleOriginatedAt, SecurityGuard } from './securityGuard.js';

export const defaultGuard = (peer: FluencePeer) => {
    return allowOnlyParticleOriginatedAt<any>(peer.getStatus().peerId!);
};

export class Srv implements SrvDef {
    private services: Set<string> = new Set();

    constructor(private peer: FluencePeer) {
        this.securityGuard_create = defaultGuard(this.peer);
        this.securityGuard_remove = defaultGuard(this.peer);
    }

    securityGuard_create: SecurityGuard<'wasm_b64_content'>;

    async create(wasm_b64_content: string, callParams: CallParams<'wasm_b64_content'>) {
        if (!this.securityGuard_create(callParams)) {
            return {
                success: false,
                error: 'Security guard validation failed',
                service_id: null,
            };
        }

        try {
            const newServiceId = uuidv4();
            const buffer = Buffer.from(wasm_b64_content, 'base64');
            const sab = new SharedArrayBuffer(buffer.length);
            const tmp = new Uint8Array(sab);
            tmp.set(buffer, 0);
            await this.peer.registerMarineService(sab, newServiceId);
            this.services.add(newServiceId);

            return {
                success: true,
                service_id: newServiceId,
                error: null,
            };
        } catch (err: any) {
            return {
                success: true,
                service_id: null,
                error: err.message,
            };
        }
    }

    securityGuard_remove: SecurityGuard<'service_id'>;

    remove(service_id: string, callParams: CallParams<'service_id'>) {
        if (!this.securityGuard_remove(callParams)) {
            return {
                success: false,
                error: 'Security guard validation failed',
                service_id: null,
            };
        }

        if (!this.services.has(service_id)) {
            return {
                success: false,
                error: `Service with id ${service_id} not found`,
            };
        }

        this.peer.removeMarineService(service_id);
        this.services.delete(service_id);

        return {
            success: true,
            error: null,
        };
    }

    list() {
        return Array.from(this.services.values());
    }
}

export class NodeUtils implements NodeUtilsDef {
    constructor(private peer: FluencePeer) {
        this.securityGuard_readFile = defaultGuard(this.peer);
    }

    securityGuard_readFile: SecurityGuard<'path'>;

    async read_file(path: string, callParams: CallParams<'path'>) {
        // TODO: split node-only and universal services into different client packages
        // if (!isNode) {
        //     return {
        //         success: false,
        //         error: 'read_file is only supported in node.js',
        //         content: null,
        //     };
        // }

        if (!this.securityGuard_readFile(callParams)) {
            return {
                success: false,
                error: 'Security guard validation failed',
                content: null,
            };
        }

        try {
            // eval('require') is needed so that
            // webpack will complain about missing dependencies for web target
            const r = eval('require');
            const fs = r('fs').promises;
            const data = await fs.readFile(path);
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