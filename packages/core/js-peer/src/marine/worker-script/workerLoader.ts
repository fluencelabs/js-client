import { LazyLoader } from '../../interfaces/index.js';

// @ts-ignore
import type { WorkerImplementation } from 'threads/dist/types/master';
// @ts-ignore
import { Worker } from 'threads';

export class WorkerLoader extends LazyLoader<WorkerImplementation> {
    constructor() {
        super(() => new Worker('./'));
    }
}
