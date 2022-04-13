import { SecurityTetraplet } from '@fluencelabs/avm';
import { CallParams, PeerIdB58 } from '../commonTypes';
import { KeyPair } from '../KeyPair';
import { SigDef } from '../_aqua/services';

/**
 * A predicate of call params for sig service's sign method which determines whether signing operation is allowed or not
 */
export type SigSecurityGuard = (params: CallParams<'data'>) => boolean;

/**
 * Only allow calls when tetraplet for 'data' argument satisfies the predicate
 */
export const allowTetraplet = (pred: (tetraplet: SecurityTetraplet) => boolean): SigSecurityGuard => {
    return (params) => {
        const t = params.tetraplets.data[0];
        return pred(t);
    };
};

/**
 * Only allow data which comes from the specified serviceId and fnName
 */
export const allowServiceFn = (serviceId: string, fnName: string): SigSecurityGuard => {
    return allowTetraplet((t) => {
        return t.service_id === serviceId && t.function_name === fnName;
    });
};

/**
 * Only allow data originated from the specified json_path
 */
export const allowExactJsonPath = (jsonPath: string): SigSecurityGuard => {
    return allowTetraplet((t) => {
        return t.json_path === jsonPath;
    });
};

/**
 * Only allow signing when particle is initiated at the specified peer
 */
export const allowOnlyParticleOriginatedAt = (peerId: PeerIdB58): SigSecurityGuard => {
    return (params) => {
        return params.initPeerId === peerId;
    };
};

/**
 * Only allow signing when all of the predicates are satisfied.
 * Useful for predicates reuse
 */
export const and = (...predicates: SigSecurityGuard[]): SigSecurityGuard => {
    return (params) => predicates.every((x) => x(params));
};

/**
 * Only allow signing when any of the predicates are satisfied.
 * Useful for predicates reuse
 */
export const or = (...predicates: SigSecurityGuard[]): SigSecurityGuard => {
    return (params) => predicates.some((x) => x(params));
};

export const defaultSigGuard = (peerId: PeerIdB58) => {
    return and(
        allowOnlyParticleOriginatedAt(peerId),
        or(
            allowServiceFn('trust-graph', 'get_trust_bytes'),
            allowServiceFn('trust-graph', 'get_revocation_bytes'),
            allowServiceFn('registry', 'get_key_bytes'),
            allowServiceFn('registry', 'get_record_bytes'),
            allowServiceFn('registry', 'get_host_record_bytes'),
        ),
    );
};

export class Sig implements SigDef {
    private _keyPair: KeyPair;

    constructor(keyPair: KeyPair) {
        this._keyPair = keyPair;
    }

    /**
     *
     */
    securityGuard: SigSecurityGuard = (params) => {
        return true;
    };

    /**
     * Gets the public key of KeyPair. Required by aqua
     */
    get_pub_key() {
        return this._keyPair.toB58String();
    }

    /**
     * Signs the data using key pair's private key. Required by aqua
     */
    async sign(
        data: number[],
        callParams: CallParams<'data'>,
    ): Promise<{ error: string | null; signature: number[] | null; success: boolean }> {
        if (!this.securityGuard(callParams)) {
            return {
                success: false,
                error: 'Security guard validation failed',
                signature: null,
            };
        }

        const signedData = await this._keyPair.signBytes(Uint8Array.from(data));

        return {
            success: true,
            error: null,
            signature: Array.from(signedData),
        };
    }

    /**
     * Verifies the signature. Required by aqua
     */
    verify(signature: number[], data: number[]): Promise<boolean> {
        return this._keyPair.verify(Uint8Array.from(data), Uint8Array.from(signature));
    }
}
