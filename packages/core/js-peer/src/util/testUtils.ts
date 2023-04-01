import * as api from '@fluencelabs/aqua-api/aqua-api.js';

import { promises as fs } from 'fs';
import { DEFAULT_CONFIG, FluencePeer, PeerConfig } from '../jsPeer/FluencePeer.js';
import { Particle } from '../particle/Particle.js';
import { ClientConfig, IFluenceClient, RelayOptions, ServiceDef } from '@fluencelabs/interfaces';
import { callAquaFunction } from '../compilerSupport/callFunction.js';

import { MarineBackgroundRunner } from '../marine/worker/index.js';
import { MarineBasedAvmRunner } from '../jsPeer/avm.js';
import { WorkerLoader } from '../marine/worker-script/workerLoader.js';
import { KeyPair } from '../keypair/index.js';
import { Subject, Subscribable } from 'rxjs';
import { WrapFnIntoServiceCall } from '../jsServiceHost/serviceUtils.js';
import { ClientPeer, makeClientPeerConfig } from '../clientPeer/ClientPeer.js';
import { WasmLoaderFromNpm } from '../marine/deps-loader/node.js';
import { IConnection } from '../connection/interfaces.js';

export const registerHandlersHelper = (
    peer: FluencePeer,
    particle: Particle,
    handlers: Record<string, Record<string, any>>,
) => {
    Object.entries(handlers).forEach(([serviceId, service]) => {
        Object.entries(service).forEach(([fnName, fn]) => {
            peer.internals.regHandler.forParticle(particle.id, serviceId, fnName, WrapFnIntoServiceCall(fn));
        });
    });
};

export type CompiledFnCall = (peer: IFluenceClient, args: { [key: string]: any }) => Promise<unknown>;
export type CompiledFile = {
    functions: { [key: string]: CompiledFnCall };
    services: { [key: string]: ServiceDef };
};

export const compileAqua = async (aquaFile: string): Promise<CompiledFile> => {
    await fs.access(aquaFile);

    const compilationResult = await api.Aqua.compile(new api.Path(aquaFile), [], undefined);

    if (compilationResult.errors.length > 0) {
        throw new Error('Aqua compilation failed. Error: ' + compilationResult.errors.join('/n'));
    }

    const functions = Object.entries(compilationResult.functions)
        .map(([name, fnInfo]) => {
            const callFn = (peer: IFluenceClient, args: { [key: string]: any }) => {
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

class NoopConnection implements IConnection {
    getRelayPeerId(): string {
        return 'nothing_here';
    }
    supportsRelay(): boolean {
        return true;
    }
    particleSource: Subscribable<Particle> = new Subject<Particle>();

    sendParticle(nextPeerIds: string[], particle: Particle): Promise<void> {
        return Promise.resolve();
    }
}

export class TestPeer extends FluencePeer {
    constructor(keyPair: KeyPair, connection: IConnection) {
        const workerLoader = new WorkerLoader();
        const controlModuleLoader = new WasmLoaderFromNpm('@fluencelabs/marine-js', 'marine-js.wasm');
        const avmModuleLoader = new WasmLoaderFromNpm('@fluencelabs/avm', 'avm.wasm');
        const marine = new MarineBackgroundRunner(workerLoader, controlModuleLoader);
        const avm = new MarineBasedAvmRunner(marine, avmModuleLoader);
        super(DEFAULT_CONFIG, keyPair, marine, avm, connection);
    }
}

export const mkTestPeer = async () => {
    const kp = await KeyPair.randomEd25519();
    const conn = new NoopConnection();
    return new TestPeer(kp, conn);
};

export const withPeer = async (action: (p: FluencePeer) => Promise<void>) => {
    const p = await mkTestPeer();
    try {
        await p.start();
        await action(p);
    } finally {
        await p.stop();
    }
};

export const withClient = async (
    relay: RelayOptions,
    config: ClientConfig,
    action: (client: ClientPeer) => Promise<void>,
) => {
    const workerLoader = new WorkerLoader();
    const controlModuleLoader = new WasmLoaderFromNpm('@fluencelabs/marine-js', 'marine-js.wasm');
    const avmModuleLoader = new WasmLoaderFromNpm('@fluencelabs/avm', 'avm.wasm');
    const marine = new MarineBackgroundRunner(workerLoader, controlModuleLoader);
    const avm = new MarineBasedAvmRunner(marine, avmModuleLoader);
    const { keyPair, peerConfig, relayConfig } = await makeClientPeerConfig(relay, config);
    const client = new ClientPeer(peerConfig, relayConfig, keyPair, marine, avm);
    try {
        await client.connect();
        await action(client);
    } finally {
        await client.disconnect();
    }
};
