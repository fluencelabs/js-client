import { SecurityTetraplet } from '@fluencelabs/avm';
import { PeerIdB58 } from './commonTypes';

export interface CallParams<ArgName extends string | null> {
    particleId: string;
    initPeerId: PeerIdB58;
    timeStamp: number;
    ttl: number;
    signature: string;
    tetraplets: { [key in ArgName]: SecurityTetraplet[] };
}
