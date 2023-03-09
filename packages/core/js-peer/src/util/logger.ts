import debug from 'debug';
import { Particle } from '../js-peer/Particle.js';
import { dataToString } from '../js-peer/utils.js';

// Format particle as a short string omitting data
debug.formatters.ptcl = (particle: Particle) => {
    return particle.id;
};

// Format particle with data
debug.formatters.ptcl_data = (particle: Particle) => {
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
debug.formatters.avm_data = (avmData: Uint8Array) => {
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
    return {
        error: debug(`${name}:error`),
        trace: debug(`${name}:trace`),
        debug: debug(`${name}:debug`),
    };
}

export function marineLogger(serviceId: string): MarineLogger {
    return {
        warn: debug(`fluence:marine:${serviceId}:warn`),
        error: debug(`fluence:marine:${serviceId}:error`),
        debug: debug(`fluence:marine:${serviceId}:debug`),
        trace: debug(`fluence:marine:${serviceId}:trace`),
        info: debug(`fluence:marine:${serviceId}:info`),
    };
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
