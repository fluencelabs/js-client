import { AirInterpreter, LogLevel as AvmLogLevel } from '@fluencelabs/avm';
import log from 'loglevel';
import { AvmLoglevel, FluencePeer } from './FluencePeer';
import { RequestFlowBuilder } from './RequestFlowBuilder';

export const createInterpreter = (handler, peerId, logLevel: AvmLoglevel): Promise<AirInterpreter> => {
    const logFn = (level: AvmLogLevel, msg: string) => {
        switch (level) {
            case 'error':
                log.error(msg);
                break;

            case 'warn':
                log.warn(msg);
                break;

            case 'info':
                log.info(msg);
                break;

            case 'debug':
            case 'trace':
                log.log(msg);
                break;
        }
    };
    return AirInterpreter.create(handler, peerId, logLevel, logFn);
};

/**
 * Checks the network connection by sending a ping-like request to relat node
 * @param { FluenceClient } peer - The Fluence Client instance.
 */
export const checkConnection = async (peer: FluencePeer, ttl?: number): Promise<boolean> => {
    if (!peer.getStatus().isConnected) {
        return false;
    }

    const msg = Math.random().toString(36).substring(7);
    const callbackFn = 'checkConnection';
    const callbackService = '_callback';

    const [request, promise] = new RequestFlowBuilder()
        .withRawScript(
            `(seq 
        (call init_relay ("op" "identity") [msg] result)
        (call %init_peer_id% ("${callbackService}" "${callbackFn}") [result])
    )`,
        )
        .withTTL(ttl)
        .withVariables({
            msg,
        })
        .buildAsFetch<[string]>(callbackService, callbackFn);

    await peer.internals.initiateFlow(request);

    try {
        const [result] = await promise;
        if (result != msg) {
            log.warn("unexpected behavior. 'identity' must return the passed arguments.");
        }
        return true;
    } catch (e) {
        log.error('Error on establishing connection: ', e);
        return false;
    }
};

export const ParticleDataToString = (data: Uint8Array): string => {
    return new TextDecoder().decode(Buffer.from(data));
};
