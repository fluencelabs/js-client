import debug from 'debug';
import { Particle } from '../js-peer/Particle.js';
import { dataToString, jsonify } from '../js-peer/utils.js';

// Format particle as a short string omitting data
debug.formatters.ptcl_id = (ptl: Particle) => {
    return ptl.id;
};

// Format particle as a short string omitting data
debug.formatters.avm_data = (avmData: Uint8Array) => {
    return dataToString(avmData);
};

// Format particle with data
debug.formatters.ptl_full = (particle: Particle) => {
    return jsonify({
        id: particle.id,
        init_peer_id: particle.initPeerId,
        timestamp: particle.timestamp,
        ttl: particle.ttl,
        script: particle.script,
        signature: particle.signature,
        callResults: particle.callResults,
    });
};

type Logger = (formatter: any, ...args: any[]) => void;

export type LoggerCommon = {
    error: Logger;
    trace: Logger;
};

export type LoggerMarine = {
    warn: Logger;
    error: Logger;
    debug: Logger;
    trace: Logger;
    info: Logger;
};

export function logger(name: string) {
    return {
        error: debug(`${name}:error`),
        trace: debug(`${name}:trace`),
        debug: debug(`${name}:debug`),
    };
}

export function marineLogger(serviceId: string) {
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
