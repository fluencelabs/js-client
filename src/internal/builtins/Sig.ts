import { SecurityTetraplet } from '@fluencelabs/avm-runner-interface';
import { CallParams, PeerIdB58 } from '../commonTypes';
import { FluencePeer } from '../FluencePeer';
import { KeyPair } from '../KeyPair';
import { SigDef } from '../_aqua/services';

type SigSecurityGuard = (params: CallParams<'data'>) => boolean;

export const allowTetraplet = (pred: (tetraplet: SecurityTetraplet) => boolean): SigSecurityGuard => {
    return (params) => {
        const t = params.tetraplets.data[0];
        return pred(t);
    };
};

export const allowServiceFn = (serviceId: string, fnName: string): SigSecurityGuard => {
    return allowTetraplet((t) => {
        return t.service_id === serviceId && t.function_name === fnName;
    });
};

export const allowExactJsonPath = (jsonPath: string): SigSecurityGuard => {
    return allowTetraplet((t) => {
        return t.json_path === jsonPath;
    });
};

export const allowOnlyParticleOriginatedAt = (peerId: PeerIdB58): SigSecurityGuard => {
    return (params) => {
        return params.initPeerId === peerId;
    };
};

export const and = (...predicates: SigSecurityGuard[]): SigSecurityGuard => {
    return (params) => predicates.every((x) => x(params));
};

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
        ),
    );
};

export class Sig implements SigDef {
    private _keyPair: KeyPair;

    constructor(keyPair: KeyPair) {
        this._keyPair = keyPair;
    }

    securityGuard: SigSecurityGuard = (params) => {
        return true;
    };

    get_pub_key() {
        return this._keyPair.toB58String();
    }

    async sign(data: number[], callParams: CallParams<'data'>): Promise<number[]> {
        if (!this.securityGuard(callParams)) {
            throw 'Security guard validation failed';
        }

        const signedData = await this._keyPair.signBytes(Uint8Array.from(data));
        return Array.from(signedData);
    }

    verify(signature: number[], data: number[]): Promise<boolean> {
        return this._keyPair.verify(Uint8Array.from(data), Uint8Array.from(signature));
    }
}
