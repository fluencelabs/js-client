import * as api from '@fluencelabs/aqua-api/aqua-api.js';

import { promises as fs } from 'fs';
import {FluencePeer, PeerConfig} from '../FluencePeer.js';
import { Particle } from '../Particle.js';
import { MakeServiceCall } from '../utils.js';
import { avmModuleLoader, controlModuleLoader } from '../utilsForNode.js';
import { ServiceDef } from '@fluencelabs/interfaces';
import { callAquaFunction } from '../../compilerSupport/callFunction.js';

import { marineLogFunction } from '../utils.js';
import { MarineBackgroundRunner } from '../../marine/worker/index.js';
import { MarineBasedAvmRunner } from '../avm.js';
import { nodes } from './connection.js';
import {WorkerLoaderFromFs} from '../../marine/deps-loader/node.js';
import {createClient} from "../../../../../client/js-client.node";

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
                return callAquaFunction({
                    def: fnInfo.funcDef,
                    script: fnInfo.script,
                    config: {},
                    peer: peer,
                    args,
                });
            };
            return { [name]: callFn };
        })
        .reduce((agg, obj) => {
            return { ...agg, ...obj };
        }, {});

    return { functions, services: compilationResult.services };
};

export const mkTestPeer = () => {
    const workerLoader = new WorkerLoaderFromFs('../../marine/worker-script');

    const marine = new MarineBackgroundRunner(workerLoader, controlModuleLoader, marineLogFunction);
    const avm = new MarineBasedAvmRunner(marine, avmModuleLoader, undefined);
    return new FluencePeer(marine, avm);
};

export const withPeer = async (action: (p: FluencePeer) => Promise<void>, config?: PeerConfig) => {
    const p = createClient() 
    try {
        console.log("connecting to: ")
        console.log(config)
        await p.start(config).catch((e: any) => console.log("connection error: " + e));
        console.log("connected")
        await action(p).catch((e) => console.log("ERRORRRRR: " + e));
    } finally {
        console.log("stopping")
        await p!.stop();
        console.log("stoped")
    }
};

export const withConnectedPeer = async (action: (p: FluencePeer) => Promise<void>, config?: PeerConfig) => {
    return withPeer(action, { relay: nodes[0] });
};
