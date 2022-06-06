import { Fluence } from '@fluencelabs/fluence';
import fs from 'fs';
import { call } from './_aqua/marine-js';

const main = async () => {
    const wasm = await fs.promises.readFile(__dirname + '__test__/integration/greeting.wasm');
    await Fluence.registerMarineService(wasm, 'greeting');
    const res = await call('test');
    return res;
};

main()
    .then((res) => {
        console.log('done', res);
    })
    .catch((err) => {
        console.error(err);
    });
