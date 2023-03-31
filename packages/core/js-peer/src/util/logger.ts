import debug from 'debug';
import { Particle } from '../particle/Particle.js';

// Format avm data as a string
debug.formatters.a = (avmData: Uint8Array) => {
    return new TextDecoder().decode(Buffer.from(avmData));
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
        error: debug(`fluence:${name}:error`),
        trace: debug(`fluence:${name}:trace`),
        debug: debug(`fluence:${name}:debug`),
    };
}

export function marineLogger(serviceId: string): MarineLogger {
    const name = `fluence:marine:${serviceId}`;
    return {
        warn: debug(`${name}:warn`),
        error: debug(`${name}:error`),
        debug: debug(`${name}:debug`),
        trace: debug(`${name}:trace`),
        info: debug(`${name}:info`),
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
