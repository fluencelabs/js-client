import { RelayOptions } from '@fluencelabs/interfaces';
import { multiaddr, Multiaddr } from '@multiformats/multiaddr';
import { isString } from './utils.js';

export function relayOptionToMultiaddr(relay: RelayOptions): Multiaddr {
    const multiaddrString = isString(relay) ? relay : relay.multiaddr;
    const ma = multiaddr(multiaddrString);

    throwIfHasNoPeerId(ma);

    return ma;
}

export function throwIfHasNoPeerId(ma: Multiaddr): void {
    const peerId = ma.getPeerId();
    if (!peerId) {
        throw new Error('Specified multiaddr is invalid or missing peer id: ' + ma.toString());
    }
}
