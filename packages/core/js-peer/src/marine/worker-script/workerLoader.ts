import { LazyLoader } from '../../interfaces/index.js';

import type { WorkerImplementation } from 'threads/dist/types/master';
import { Worker } from 'threads';

export class WorkerLoader extends LazyLoader<WorkerImplementation> {
    constructor() {
        super(() => new Worker('./'));
    }
}
