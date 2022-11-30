import { Worker } from 'threads';

export default () => {
    return new Worker('./marine-js.node.js');
};
