import { jsonify } from '../util/utils.js';
import {
    CallServiceData,
    CallServiceResult,
    GenericCallServiceHandler,
    IJsServiceHost,
    ResultCodes,
} from './interfaces.js';

export class JsServiceHost implements IJsServiceHost {
    private particleScopeHandlers = new Map<string, Map<string, GenericCallServiceHandler>>();
    private commonHandlers = new Map<string, GenericCallServiceHandler>();

    /**
     * Returns true if any handler for the specified serviceId is registered
     */
    containsService(serviceId: string): boolean {
        return this.commonHandlers.has(serviceId) || this.particleScopeHandlers.has(serviceId);
    }

    /**
     * Removes all handlers associated with the specified particle scope
     * @param particleId Particle ID to remove handlers for
     */
    removeParticleScopeHandlers(particleId: string): void {
        this.particleScopeHandlers.delete(particleId);
    }

    /**
     * Find call service handler for specified particle
     * @param serviceId Service ID as specified in `call` air instruction
     * @param fnName Function name as specified in `call` air instruction
     * @param particleId Particle ID
     */
    getHandler(serviceId: string, fnName: string, particleId: string): GenericCallServiceHandler | null {
        const key = serviceFnKey(serviceId, fnName);
        const psh = this.particleScopeHandlers.get(particleId);
        let handler: GenericCallServiceHandler | undefined = undefined;

        // we should prioritize handler for this particle if there is one
        // if particle-scoped handler exist for this particle try getting handler there
        if (psh !== undefined) {
            handler = psh.get(key);
        }

        // then try to find a common handler for all particles with this service-fn key
        // if there is no particle-specific handler, get one from common map
        if (handler === undefined) {
            handler = this.commonHandlers.get(key);
        }

        return handler || null;
    }

    /**
     * Execute service call for specified call service data. Return null if no handler was found
     */
    async callService(req: CallServiceData): Promise<CallServiceResult | null> {
        const handler = this.getHandler(req.serviceId, req.fnName, req.particleContext.particleId);

        if (handler === null) {
            return null;
        }

        const result = await handler(req);

        // Otherwise AVM might break
        if (result.result === undefined) {
            result.result = null;
        }

        return result;
    }

    /**
     * Register handler for all particles
     */
    registerGlobalHandler(serviceId: string, fnName: string, handler: GenericCallServiceHandler): void {
        this.commonHandlers.set(serviceFnKey(serviceId, fnName), handler);
    }

    /**
     * Register handler which will be called only for particle with the specific id
     */
    registerParticleScopeHandler(
        particleId: string,
        serviceId: string,
        fnName: string,
        handler: GenericCallServiceHandler,
    ): void {
        let psh = this.particleScopeHandlers.get(particleId);
        if (psh === undefined) {
            psh = new Map<string, GenericCallServiceHandler>();
            this.particleScopeHandlers.set(particleId, psh);
        }

        psh.set(serviceFnKey(serviceId, fnName), handler);
    }
}

function serviceFnKey(serviceId: string, fnName: string) {
    return `${serviceId}/${fnName}`;
}
