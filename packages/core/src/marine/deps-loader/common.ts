import { BlobWorker } from 'threads';
import { fromBase64 } from 'js-base64';
import type { WorkerImplementation } from 'threads/dist/types/master';
import { LazyLoader } from '../../interfaces';

export class InlinedWorkerLoader extends LazyLoader<WorkerImplementation> {
    constructor(b64script: string) {
        super(() => {
            const script = fromBase64(b64script);
            return Promise.resolve(BlobWorker.fromText(script));
        });
    }
}
