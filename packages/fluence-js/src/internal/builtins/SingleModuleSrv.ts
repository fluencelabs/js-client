import { v4 as uuidv4 } from 'uuid';
import { SrvDef } from '../_aqua/single-module-srv';
import { NodeUtilsDef } from '../_aqua/node-utils';
import { FluencePeer } from '../FluencePeer';
import { isNode } from 'browser-or-node';
import { CallParams } from '../commonTypes';
import { allowOnlyParticleOriginatedAt, SecurityGuard } from './securityGuard';

export const defaultGuard = (peer: FluencePeer) => {
    return allowOnlyParticleOriginatedAt<any>(peer.getStatus().peerId!);
};

export class Srv implements SrvDef {
    private services: Set<string> = new Set();

    constructor(private peer: FluencePeer) {}

    createSecurityGuard: SecurityGuard<'wasm_b64_content'> = defaultGuard(this.peer);

    async create(wasm_b64_content: string, callParams: CallParams<'wasm_b64_content'>) {
        if (!this.createSecurityGuard(callParams)) {
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

    removeSecurityGuard: SecurityGuard<'service_id'> = defaultGuard(this.peer);

    remove(service_id: string, callParams: CallParams<'service_id'>) {
        if (!this.removeSecurityGuard(callParams)) {
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
    constructor(private peer: FluencePeer) {}

    readFileSecurityGuard: SecurityGuard<'path'> = defaultGuard(this.peer);

    async read_file(path: string, callParams: CallParams<'path'>) {
        if (!isNode) {
            return {
                success: false,
                error: 'read_file is only supported in node.js',
                content: null,
            };
        }

        if (!this.readFileSecurityGuard(callParams)) {
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
            const path = r('path');
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
