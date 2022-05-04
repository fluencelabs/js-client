import { Fluence } from '../src/index';
import { krasnodar } from '@fluencelabs/fluence-network-environment';

async function main() {
    await Fluence.start({
        connectTo: krasnodar[4],
    });

    alert('started');

    await Fluence.stop();
}

main();
