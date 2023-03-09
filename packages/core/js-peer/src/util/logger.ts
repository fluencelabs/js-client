import debug from 'debug';
import { Particle } from '../js-peer/Particle.js';
import { dataToString } from '../js-peer/utils.js';

// Format particle as a short string omitting data
debug.formatters.p = (particle: Particle) => {
    return particle.id;
};

// Format particle with data
debug.formatters.P = (particle: Particle) => {
    return JSON.stringify({
        init_peer_id: particle.initPeerId,
        timestamp: particle.timestamp,
        ttl: particle.ttl,
        script: particle.script,
        signature: particle.signature,
        callResults: particle.callResults,
    });
};

// Format avm data as a string
debug.formatters.a = (avmData: Uint8Array) => {
    return dataToString(avmData);
};

type Logger = (formatter: any, ...args: any[]) => void;

export interface CommonLogger {
    error: Logger;
    trace: Logger;
    debug: Logger;
}

export interface MarineLogger {
    warn: Logger;
    error: Logger;
    debug: Logger;
    trace: Logger;
    info: Logger;
}

export function logger(name: string): CommonLogger {
    return Object.assign(debug(name), {
        error: debug(`${name}:error`),
        trace: debug(`${name}:trace`),
        debug: debug(`${name}:debug`),
    });
}

export function marineLogger(serviceId: string): MarineLogger {
    const name = 'fluence:marine:${serviceId}';
    return Object.assign(debug(name), {
        warn: debug(`:${serviceId}:warn`),
        error: debug(`${name}:error`),
        debug: debug(`${name}:debug`),
        trace: debug(`${name}:trace`),
        info: debug(`${name}:info`),
    });
}

export function disable() {
    debug.disable();
}

export function enable(namespaces: string) {
    debug.enable(namespaces);
}

export function enabled(namespaces: string) {
    return debug.enabled(namespaces);
}
