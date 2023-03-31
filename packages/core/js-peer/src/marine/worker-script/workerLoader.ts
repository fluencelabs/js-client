// @ts-ignore
import type { WorkerImplementation } from 'threads/dist/types/master';
// @ts-ignore
import { Worker } from 'threads';
import { LazyLoader } from '../interfaces.js';

export class WorkerLoader extends LazyLoader<WorkerImplementation> {
    constructor() {
        super(() => new Worker('./'));
    }
}
