import { ClientConfig, ConnectionState, IFluenceClient, PeerIdB58, RelayOptions } from '@fluencelabs/interfaces';
import { RelayConnection, RelayConnectionConfig } from '../connection/RelayConnection.js';
import { fromOpts, KeyPair } from '../keypair/index.js';
import { FluencePeer, PeerConfig } from '../jsPeer/FluencePeer.js';
import { relayOptionToMultiaddr } from '../util/libp2pUtils.js';
import { IAvmRunner, IMarineHost } from '../marine/interfaces.js';

export const makeClientPeerConfig = async (
    relay: RelayOptions,
    config: ClientConfig,
): Promise<{ peerConfig: PeerConfig; relayConfig: RelayConnectionConfig; keyPair: KeyPair }> => {
    const opts = config?.keyPair || { type: 'Ed25519', source: 'random' };
    const keyPair = await fromOpts(opts);
    const relayAddress = relayOptionToMultiaddr(relay);

    return {
        peerConfig: {
            debug: config?.debug,
            defaultTtlMs: config?.defaultTtlMs,
        },
        relayConfig: {
            peerId: keyPair.getLibp2pPeerId(),
            relayAddress: relayAddress,
            dialTimeoutMs: config?.connectionOptions?.dialTimeoutMs,
        },
        keyPair: keyPair,
    };
};

export class ClientPeer extends FluencePeer implements IFluenceClient {
    private relayPeerId: PeerIdB58;
    private relayConnection: RelayConnection;

    constructor(
        peerConfig: PeerConfig,
        relayConfig: RelayConnectionConfig,
        keyPair: KeyPair,
        marine: IMarineHost,
        avmRunner: IAvmRunner,
    ) {
        const relayConnection = new RelayConnection(relayConfig);

        super(peerConfig, keyPair, marine, avmRunner, relayConnection);
        this.relayPeerId = relayConnection.getRelayPeerId();
        this.relayConnection = relayConnection;
    }

    getPeerId(): string {
        return this.keyPair.getPeerId();
    }

    getPeerSecretKey(): Uint8Array {
        return this.keyPair.toEd25519PrivateKey();
    }

    connectionState: ConnectionState = 'disconnected';
    connectionStateChangeHandler: (state: ConnectionState) => void = () => {};

    getRelayPeerId(): string {
        return this.relayPeerId;
    }

    onConnectionStateChange(handler: (state: ConnectionState) => void): ConnectionState {
        this.connectionStateChangeHandler = handler;

        return this.connectionState;
    }

    private changeConnectionState(state: ConnectionState) {
        this.connectionState = state;
        this.connectionStateChangeHandler(state);
    }

    /**
     * Connect to the Fluence network
     */
    async connect(): Promise<void> {
        this.changeConnectionState('connecting');
        await super.start();
        await this.relayConnection.start();
        // TODO: check connection here
        this.changeConnectionState('connected');
    }

    /**
     * Disconnect from the Fluence network
     */
    async disconnect(): Promise<void> {
        this.changeConnectionState('disconnecting');
        await this.relayConnection.stop();
        await this.stop();
        this.changeConnectionState('disconnected');
    }
}
