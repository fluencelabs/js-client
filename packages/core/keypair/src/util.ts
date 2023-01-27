import { baseX } from 'multiformats/src/bases/base';

export const base58 = baseX({
    name: 'b58',
    prefix: '',
    alphabet: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
});
