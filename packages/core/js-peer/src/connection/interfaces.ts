import type { PeerIdB58 } from '@fluencelabs/interfaces';
import type { Subscribable } from 'rxjs';
import { IParticle } from '../particle/interfaces.js';

/**
 * Interface for connection used in Fluence Peer.
 */
export interface IConnection {
    /**
     * Observable that emits particles received from the connection.
     */
    particleSource: Subscribable<IParticle>;

    /**
     * Send particle to the network using the connection.
     * @param nextPeerIds - list of peer ids to send the particle to
     * @param particle - particle to send
     */
    sendParticle(nextPeerIds: PeerIdB58[], particle: IParticle): Promise<void>;

    /**
     * Get peer id of the relay peer. Throws an error if the connection doesn't support relay.
     */
    getRelayPeerId(): PeerIdB58;

    /**
     * Check if the connection supports relay.
     */
    supportsRelay(): boolean;
}
