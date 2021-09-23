import { CallRequest, CallServiceResult, InterpreterResult } from '@fluencelabs/avm';
import { Particle } from './particle';

export class ParticleExecFlow {
    private _state: Particle;
    prevData: Uint8Array = Buffer.from([]);
    interpreterResult: InterpreterResult | null = null;
    callResults: Array<[key: number, callServiceResult: CallServiceResult]> = [];

    constructor(particle: Particle) {
        this._state = particle;
    }

    mergeWithIncoming(incoming: Particle) {
        this._state.data = incoming.data;
    }

    mergeInterpreterResult(interpreterResult: InterpreterResult) {
        this.interpreterResult = interpreterResult;
    }

    processingDone(): boolean {
        if (this.interpreterResult === null) {
            return false;
        }

        return this.callResults.length === this.interpreterResult.callRequests.length;
    }

    getParticle = () => this._state;

    hasExpired(): boolean {
        return this.getParticle().hasExpired();
    }
}

export type ParticleOp =
    | {
          op: 'incoming';
          particle: Particle;
      }
    | {
          op: 'expired';
          particleId: string;
      }
    | {
          op: 'shouldCallInterpreter';
          particleId: string;
      }
    | {
          op: 'interpreterResult';
          particleId: string;
          interpreterResult: InterpreterResult;
      }
    | {
          op: 'callbackFinished';
          particleId: string;
          key: number;
          callServiceResult: CallServiceResult;
      };
