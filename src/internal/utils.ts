import { AirInterpreter, LogLevel as AvmLogLevel } from '@fluencelabs/avm';
import log from 'loglevel';
import { CallServiceHandler } from './CallServiceHandler';
import { AvmLoglevel, FluencePeer } from './FluencePeer';
import { Particle } from './particle';

export const createInterpreter = (logLevel: AvmLoglevel): Promise<AirInterpreter> => {
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
    return AirInterpreter.create(logLevel, logFn);
};

export const registerHandlersHelper = (peer: FluencePeer, particle: Particle, handlers) => {
    const { _timeout, ...rest } = handlers;
    if (_timeout) {
        peer.internals.registerTimeoutHandler(particle.id, _timeout);
    }
    for (let serviceId in rest) {
        for (let fnName in rest[serviceId]) {
            peer.internals.registerParticleSpecificHandler(particle.id, serviceId, fnName, rest[serviceId][fnName]);
        }
    }
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

    const promise = new Promise<string>((resolve, reject) => {
        const script = `
    (xor
        (seq
            (call %init_peer_id% ("load" "relay") [] init_relay)
            (seq
                (call %init_peer_id% ("load" "msg") [] msg)
                (seq 
                    (call init_relay ("op" "identity") [msg] result)
                    (call %init_peer_id% ("callback" "callback") [result])
                )
            )
        )
        (seq 
            (call init_relay ("op" "identity") [])
            (call %init_peer_id% ("callback" "error") [%last_error%])
        )
    )`;
        const particle = Particle.createNew(script, ttl);
        registerHandlersHelper(peer, particle, {
            load: {
                relay: () => {
                    peer.getStatus().relayPeerId;
                },
                msg: () => {
                    return msg;
                },
            },
            callback: {
                callback: (args) => {
                    const [val] = args;
                    resolve(val);
                },
                error: (args) => {
                    const [error] = args;
                    reject(error);
                },
            },
            _timeout: reject,
        });

        peer.internals.initiateParticle(particle);
    });

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
