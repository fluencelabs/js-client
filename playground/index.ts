import { Fluence } from '../src/index';
import { krasnodar } from '@fluencelabs/fluence-network-environment';
import { ping } from './_aqua/ping';

let interval;

// localStorage.debug = 'libp2p:*';
delete localStorage.debug;

async function main() {
    handle('connect', async () => {
        await Fluence.start({
            connectTo: krasnodar[4],
            skipCheckConnection: true,
        });
        console.log('connected');
    });
    handle('once', runPing);
    handle('pings', () => {
        interval = setInterval(runPing, 1000);
    });
    handle('stop_pings', () => {
        clearTimeout(interval);
    });
    handle('disconnect', async () => {
        await Fluence.stop();
        console.log('disconnected');
    });
}

function runPing() {
    const ts = new Date().toLocaleTimeString();
    console.log(`pinging with ${ts}`);
    ping(ts).then((res) => {
        console.log(`${ts} pong at ${new Date().toLocaleTimeString()}`);
    });
}

function handle(id: string, fn: () => void) {
    document.getElementById(id).onclick = () => {
        fn();
    };
}

main();
