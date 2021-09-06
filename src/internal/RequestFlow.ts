import log from 'loglevel';
import PeerId from 'peer-id';
import { AirInterpreter, CallServiceResult, CallRequest, InterpreterResult } from '@fluencelabs/avm';
import { CallServiceData, CallServiceHandler } from './CallServiceHandler';
import { PeerIdB58 } from './commonTypes';
import { FluenceConnection } from './FluenceConnection';
import { Particle, genUUID, logParticle } from './particle';
import { ParticleDataToString } from './utils';

export const DEFAULT_TTL = 7000;

/**
 * The class represents the current view (and state) of distributed the particle execution process from client's point of view.
 * It stores the intermediate particles state during the process. RequestFlow is identified by the id of the particle that is executed during the flow.
 * Each RequestFlow contains a separate (unique to the current flow) CallServiceHandler where the handling of `call` AIR instruction takes place
 * Please note, that RequestFlow's is handler is combined with the handler from client before the execution occures.
 * After the combination middlewares from RequestFlow are executed before client handler's middlewares.
 */
export class RequestFlow {
    private state: Particle;
    private prevData: Uint8Array = Buffer.from([]);
    private onTimeoutHandlers = [];
    private onErrorHandlers = [];
    private timeoutHandle?: NodeJS.Timeout;

    readonly id: string;
    readonly isExternal: boolean;
    readonly script: string;
    readonly handler = new CallServiceHandler();

    ttl: number = DEFAULT_TTL;
    relayPeerId?: PeerIdB58;

    static createExternal(particle: Particle): RequestFlow {
        const res = new RequestFlow(true, particle.id, particle.script);
        res.ttl = particle.ttl;
        res.state = particle;
        res.timeoutHandle = setTimeout(res.raiseTimeout.bind(res), particle.ttl);
        return res;
    }

    static createLocal(script: string, ttl?: number): RequestFlow {
        const res = new RequestFlow(false, genUUID(), script);
        res.ttl = ttl ?? DEFAULT_TTL;
        return res;
    }

    constructor(isExternal: boolean, id: string, script: string) {
        this.isExternal = isExternal;
        this.id = id;
        this.script = script;
    }

    onTimeout(handler: () => void) {
        this.onTimeoutHandlers.push(handler);
    }

    onError(handler: (error) => void) {
        this.onErrorHandlers.push(handler);
    }

    async execute(
        interpreter: AirInterpreter,
        connection: FluenceConnection,
        selfPeerId: PeerIdB58,
        relayPeerId?: PeerIdB58,
    ) {
        if (this.hasExpired()) {
            return;
        }

        logParticle(log.debug, 'interpreter executing particle', this.getParticle());
        const nextPeers = await this.runInterpreter(interpreter, selfPeerId);

        // do nothing if there are no peers to send particle further
        if (nextPeers.length === 0) {
            return;
        }

        // we only expect a single possible peer id to send particle further
        if (nextPeers.length > 1) {
            this.throwIncorrectNextPeerPks(nextPeers);
        }

        // this peer id must be the relay, the client is connected to
        if (!relayPeerId || nextPeers[0] !== relayPeerId) {
            this.throwIncorrectNextPeerPks(nextPeers);
        }

        if (!connection) {
            this.raiseError('Cannot send particle: non connected');
            return;
        }

        this.sendIntoConnection(connection);
    }

    public cancel() {
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
        }
    }

    private throwIncorrectNextPeerPks(nextPeers: PeerIdB58[]) {
        this.raiseError(
            `Particle is expected to be sent to only the single peer (relay which client is connected to).
particle id: ${this.getParticle()?.id}
next peers: ${nextPeers.join(' ')}
relay peer id: ${this.relayPeerId}
`,
        );
    }

    async initState(peerId: PeerId): Promise<void> {
        const id = this.id;
        let currentTime = Date.now();

        const particle: Particle = {
            id: id,
            init_peer_id: peerId.toB58String(),
            timestamp: currentTime,
            ttl: this.ttl,
            script: this.script,
            signature: '',
            data: Buffer.from([]),
        };

        this.state = particle;
        this.timeoutHandle = setTimeout(this.raiseTimeout.bind(this), particle.ttl);
    }

    receiveUpdate(particle: Particle) {
        this.state.data = particle.data;
    }

    async sendIntoConnection(connection: FluenceConnection): Promise<void> {
        const particle = this.state;
        try {
            await connection.sendParticle(particle);
        } catch (err) {
            log.error(`Error on sending particle with id ${particle.id}: ${err}`);
        }
    }

    async runInterpreter(interpreter: AirInterpreter, selfPeerId: string) {
        let callRequestsToExec: Array<[number, CallRequest]> = [];
        let interpreterResult: InterpreterResult;
        do {
            const cbResults = await this.execCallbacks(callRequestsToExec);

            log.debug('---------------------');
            log.debug('prev data: ', ParticleDataToString(this.prevData));
            log.debug('data: ', ParticleDataToString(this.state.data));
            interpreterResult = interpreter.invoke(
                this.state.script,
                this.prevData,
                this.state.data,
                {
                    initPeerId: this.state.init_peer_id,
                    currentPeerId: selfPeerId,
                },
                cbResults,
            );
            log.debug('new data: ', ParticleDataToString(interpreterResult.data));
            log.debug('---------------------');

            this.prevData = interpreterResult.data;
            this.state.data = Buffer.from([]);
            callRequestsToExec = interpreterResult.callRequests;
        } while (callRequestsToExec.length > 0);
        log.debug('Finished particle processing loop');

        this.state.data = this.prevData;

        log.debug('inner interpreter outcome:', {
            particleId: this.getParticle()?.id,
            retCode: interpreterResult.retCode,
            errorMessage: interpreterResult.errorMessage,
            next_peer_pks: interpreterResult.nextPeerPks,
        });

        if (interpreterResult.retCode !== 0) {
            this.raiseError(
                `Interpreter failed with code=${interpreterResult.retCode} message=${interpreterResult.errorMessage}`,
            );
        }

        return interpreterResult.nextPeerPks;
    }

    async execCallbacks(callbacks: Array<[number, CallRequest]>): Promise<Array<[number, CallServiceResult]>> {
        const particle = this.getParticle();

        const promises = callbacks.map(([k, val]) => {
            const req = {
                serviceId: val.serviceId,
                fnName: val.functionName,
                args: val.arguments,
                tetraplets: val.tetraplets,
                particleContext: {
                    particleId: this.id,
                    initPeerId: particle.init_peer_id,
                    timeStamp: particle.timestamp,
                    ttl: particle.ttl,
                    signature: particle.signature,
                },
            };
            const promise = this.handler.execute(req).then((res) => {
                if (res.result === undefined) {
                    log.error(
                        `Call to serviceId=${req.serviceId} fnName=${req.fnName} unexpectedly returned undefined result, falling back to null`,
                    );
                    res.result = null;
                }

                const returnValue = {
                    retCode: res.retCode,
                    result: JSON.stringify(res.result),
                };

                return [k, returnValue] as const;
            });
            return promise;
        });

        const res = await Promise.all(promises);
        return res as any;
    }

    getParticle = () => this.state;

    hasExpired(): boolean {
        let now = Date.now();
        const particle = this.getParticle();
        let actualTtl = particle.timestamp + particle.ttl - now;
        return actualTtl <= 0;
    }

    raiseError(error) {
        for (const h of this.onErrorHandlers) {
            h(error);
        }
    }

    private raiseTimeout() {
        const now = Date.now();
        const particle = this.state;
        log.info(`Particle expired. Now: ${now}, ttl: ${particle?.ttl}, ts: ${particle?.timestamp}`);

        for (const h of this.onTimeoutHandlers) {
            h();
        }
    }
}
