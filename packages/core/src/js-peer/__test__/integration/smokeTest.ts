import { handleTimeout } from '../../utils.js';
import { nodes } from '../connection.js';
import { mkTestPeer, registerHandlersHelper } from '../util.js';

const smokeTest = async () => {
    // arrange
    const peer = mkTestPeer();
    await peer.start({
        connectTo: nodes[0],
    });

    const result = await new Promise<string[]>((resolve, reject) => {
        const script = `
    (xor
        (seq
            (call %init_peer_id% ("load" "relay") [] init_relay)
            (seq
                (call init_relay ("op" "identity") ["hello world!"] result)
                (call %init_peer_id% ("callback" "callback") [result])
            )
        )
        (seq 
            (call init_relay ("op" "identity") [])
            (call %init_peer_id% ("callback" "error") [%last_error%])
        )
    )`;
        const particle = peer.internals.createNewParticle(script);

        if (particle instanceof Error) {
            return reject(particle.message);
        }

        registerHandlersHelper(peer, particle, {
            load: {
                relay: () => {
                    return peer.getStatus().relayPeerId;
                },
            },
            callback: {
                callback: (args: any) => {
                    const [val] = args;
                    resolve(val);
                },
                error: (args: any) => {
                    const [error] = args;
                    reject(error);
                },
            },
        });

        peer.internals.initiateParticle(particle, handleTimeout(reject));
    });

    await peer.stop();

    if (result[0] !== 'hello world!') {
        throw new Error('Expecting "hello wrold!" got ' + result[0]);
    }
};

smokeTest()
    .then(() => {
        console.log('Test passed');
    })
    .catch((err) => {
        console.error('Test failed: ', err);
    });
