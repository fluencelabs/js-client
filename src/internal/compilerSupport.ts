import { PeerIdB58 } from './commonTypes';

export interface CallParams {
    particleId: string;
    initPeerId: PeerIdB58;
    timeStamp: number;
    ttl: number;
    signature: string;
}
