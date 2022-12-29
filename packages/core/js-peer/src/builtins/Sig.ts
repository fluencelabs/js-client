import { CallParams, PeerIdB58 } from '../commonTypes';
import { KeyPair } from '@fluencelabs/keypair';
import { SigDef } from '../_aqua/services';
import { allowOnlyParticleOriginatedAt, allowServiceFn, and, or, SecurityGuard } from './securityGuard';

export const defaultSigGuard = (peerId: PeerIdB58) => {
    return and<'data'>(
        allowOnlyParticleOriginatedAt(peerId),
        or(
            allowServiceFn('trust-graph', 'get_trust_bytes'),
            allowServiceFn('trust-graph', 'get_revocation_bytes'),
            allowServiceFn('registry', 'get_key_bytes'),
            allowServiceFn('registry', 'get_record_bytes'),
            allowServiceFn('registry', 'get_record_metadata_bytes'),
            allowServiceFn('registry', 'get_tombstone_bytes'),
        ),
    );
};

export class Sig implements SigDef {
    private _keyPair: KeyPair;

    constructor(keyPair: KeyPair) {
        this._keyPair = keyPair;
    }

    /**
     * Configurable security guard for sign method
     */
    securityGuard: SecurityGuard<'data'> = (params) => {
        return true;
    };

    /**
     * Gets the public key of KeyPair. Required by aqua
     */
    get_peer_id() {
        return this._keyPair.getPeerId();
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
