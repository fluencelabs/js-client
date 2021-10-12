import { SecurityTetraplet } from '@fluencelabs/avm';
import { CallParams, PeerIdB58 } from './commonTypes';

export enum ResultCodes {
    success = 0,
    unknownError = 1,
    exceptionInHandler = 2,
}

/**
 * Particle context. Contains additional information about particle which triggered `call` air instruction from AVM
 */
export interface ParticleContext {
    /**
     * The particle ID
     */
    particleId: string;
    initPeerId: PeerIdB58;
    timestamp: number;
    ttl: number;
    signature: string;
}

/**
 * Represents the information passed from AVM when a `call` air instruction is executed on the local peer
 */
export interface CallServiceData {
    /**
     * Service ID as specified in `call` air instruction
     */
    serviceId: string;

    /**
     * Function name as specified in `call` air instruction
     */
    fnName: string;

    /**
     * Arguments as specified in `call` air instruction
     */
    args: any[];

    /**
     * Security Tetraplets received from AVM
     */
    tetraplets: SecurityTetraplet[][];

    /**
     * Particle context, @see {@link ParticleContext}
     */
    particleContext: ParticleContext;

    [x: string]: any;
}

/**
 * Type for all the possible objects that can be return to the AVM
 */
export type CallServiceResultType = object | boolean | number | string | null;

/**
 * Generic call service handler
 */
export type GenericCallServiceHandler = (req: CallServiceData) => CallServiceResult | Promise<CallServiceResult>;

/**
 * Represents the result of the `call` air instruction to be returned into AVM
 */
export interface CallServiceResult {
    /**
     * Return code to be returned to AVM
     */
    retCode: ResultCodes;

    /**
     * Result object to be returned to AVM
     */
    result: CallServiceResultType;
    [x: string]: any;
}

export class CallServiceHandler {
    private _particleSpecificHandlers = new Map<string, Map<string, GenericCallServiceHandler>>();
    private _commonHandlers = new Map<string, GenericCallServiceHandler>();
    private _timeoutHandlers = new Map<string, () => void>();

    async execute(req: CallServiceData): Promise<CallServiceResult> {
        const h = this.resolveHandler(req.particleContext.particleId, req.serviceId, req.fnName);
        if (h === null) {
            return {
                retCode: ResultCodes.unknownError,
                result: `The handler did not set any result. Make sure you are calling the right peer and the handler has been registered. Original request data was: serviceId='${req.serviceId}' fnName='${req.fnName}' args='${req.args}'`,
            };
        }
        return await h(req);
    }

    registerTimeoutHandler(particleId: string, handler: () => void) {
        this._timeoutHandlers.set(particleId, handler);
    }

    registerCommonHandler(
        // force new line
        serviceId: string,
        fnName: string,
        handler: GenericCallServiceHandler,
    ) {
        this._commonHandlers.set(this._id(serviceId, fnName), handler);
    }

    registerParticleSpecificHandler(
        particleId: string,
        serviceId: string,
        fnName: string,
        handler: GenericCallServiceHandler,
    ) {
        let psh = this._particleSpecificHandlers.get(particleId);
        if (psh === undefined) {
            psh = new Map<string, GenericCallServiceHandler>();
            this._particleSpecificHandlers.set(particleId, psh);
        }

        psh.set(this._id(serviceId, fnName), handler);
    }

    removeParticleHandlers(particleId: string) {
        this._particleSpecificHandlers.delete(particleId);
        this._timeoutHandlers.delete(particleId);
    }

    resolveHandler(particleId: string, serviceId: string, fnName: string): GenericCallServiceHandler | null {
        const id = this._id(serviceId, fnName);
        const psh = this._particleSpecificHandlers.get(particleId);
        const res = psh === undefined ? this._commonHandlers.get(id) : psh.get(id);

        return res || null;
    }

    private _id(serviceId: string, fnName: string) {
        return `${serviceId}/${fnName}`;
    }
}
