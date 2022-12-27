import api from '@fluencelabs/aqua-api/aqua-api';
import { FluencePeer } from '../internal/FluencePeer';
import { Particle } from '../internal/Particle';
import { MakeServiceCall } from '../internal/utils';
import { callFunctionImpl } from '../internal/compilerSupport/v3';

export const registerHandlersHelper = (
    peer: FluencePeer,
    particle: Particle,
    handlers: Record<string, Record<string, any>>,
) => {
    Object.entries(handlers).forEach(([serviceId, service]) => {
        Object.entries(service).forEach(([fnName, fn]) => {
            peer.internals.regHandler.forParticle(particle.id, serviceId, fnName, MakeServiceCall(fn));
        });
    });
};

export type CompiledFnCall = (peer: FluencePeer, args: { [key: string]: any }) => Promise<unknown>;
export type CompiledFile = { [key: string]: CompiledFnCall };

export const compileAqua = async (aquaFile: string): Promise<CompiledFile> => {
    const compilationResult = await api.Aqua.compile(aquaFile, [], {
        constants: [],
        logLevel: 'off',
        noRelay: false,
        noXor: false,
    });

    const compiled = Array.from(compilationResult.functions.entries())
        .map(([name, fnInfo]) => {
            const callFn = (peer: FluencePeer, args: { [key: string]: any }) => {
                return callFunctionImpl(fnInfo.funcDef, fnInfo.script, {}, peer, args);
            };
            return { [name]: callFn };
        })
        .reduce((agg, obj) => {
            return { ...agg, ...obj };
        });

    return compiled;
};
