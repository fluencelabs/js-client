import api from '@fluencelabs/aqua-api/aqua-api';
import { InlinedWorkerLoader } from '@fluencelabs/marine.deps-loader.node';

import { promises as fs } from 'fs';
import { FluencePeer } from '../FluencePeer';
import { Particle } from '../Particle';
import { avmModuleLoader, controlModuleLoader, MakeServiceCall } from '../utils';
import { ServiceDef } from '../compilerSupport/interface';
import { callFunctionImpl } from '../compilerSupport/callFunction';

import { marineLogFunction } from '../utils';
import { MarineBackgroundRunner } from '@fluencelabs/marine-runner';
import { MarineBasedAvmRunner } from '../avm';

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
export type CompiledFile = {
    functions: { [key: string]: CompiledFnCall };
    services: { [key: string]: ServiceDef };
};

export const compileAqua = async (aquaFile: string): Promise<CompiledFile> => {
    await fs.access(aquaFile);

    const compilationResult = await api.Aqua.compile(new api.Path(aquaFile), [], undefined);

    const functions = Object.entries(compilationResult.functions)
        .map(([name, fnInfo]) => {
            const callFn = (peer: FluencePeer, args: { [key: string]: any }) => {
                return callFunctionImpl(fnInfo.funcDef, fnInfo.script, {}, peer, args);
            };
            return { [name]: callFn };
        })
        .reduce((agg, obj) => {
            return { ...agg, ...obj };
        }, {});

    return { functions, services: compilationResult.services };
};

export const mkTestPeer = () => {
    const workerLoader = new InlinedWorkerLoader();

    const marine = new MarineBackgroundRunner(workerLoader, controlModuleLoader, marineLogFunction);
    const avm = new MarineBasedAvmRunner(marine, avmModuleLoader, undefined);
    return new FluencePeer(marine, avm);
};