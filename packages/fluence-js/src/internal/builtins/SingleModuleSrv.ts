import { v4 as uuidv4 } from 'uuid';
import { fromByteArray } from 'base64-js';
import { SrvDef } from '../_aqua/single-module-srv';
import { FluencePeer } from '../FluencePeer';
import { ServiceError } from '../utils';
import { isNode } from 'browser-or-node';

export class Srv implements SrvDef {
    private services: Set<string> = new Set();

    constructor(private peer: FluencePeer) {}

    async create(wasm_b64_content: string) {
        const newServiceId = uuidv4();
        const buffer = Buffer.from(wasm_b64_content, 'base64');
        const sab = new SharedArrayBuffer(buffer.length);
        const tmp = new Uint8Array(sab);
        tmp.set(buffer, 0);
        await this.peer.registerMarineService(sab, newServiceId);
        this.services.add(newServiceId);
        return newServiceId;
    }

    remove(service_id: string) {
        if (!this.services.has(service_id)) {
            throw new ServiceError(`Service with id ${service_id} not found`);
        }

        this.peer.removeMarineService(service_id);
        this.services.delete(service_id);
    }

    list() {
        return Array.from(this.services.values());
    }

    async read_file(path: string) {
        if (!isNode) {
            throw new ServiceError('read_file is only supported in node.js');
        }

        try {
            // eval('require') is needed so that
            // webpack will complain about missing dependencies for web target
            const r = eval('require');
            const path = r('path');
            const fs = r('fs').promises;
            const data = await fs.readFile(path);
            return fromByteArray(data);
        } catch (err: any) {
            throw new ServiceError(err.message);
        }
    }
}
