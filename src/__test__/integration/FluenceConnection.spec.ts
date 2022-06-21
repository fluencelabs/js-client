import { Multiaddr } from 'multiaddr';
import PeerId from 'peer-id';
import { FluenceConnection } from '../../internal/FluenceConnection';
import { Particle } from '../../internal/Particle';
import { nodes } from '../connection';

const relay = nodes[0];

describe('Fluence connection integration tests', () => {
    it('should work, bitch!', async () => {
        const pidStructure = await PeerId.create();
        const pid = pidStructure.toB58String();

        const script = `
                (seq
                    (call "${relay.peerId}" ("op" "noop") [])
                    (call "${pid}" ("op" "noop") [])
                )`;

        const promise = new Promise(async (resolve) => {
            const conn = await FluenceConnection.createConnection({
                peerId: pidStructure,
                relayAddress: new Multiaddr(relay.multiaddr),
                onIncomingParticle: (p) => {
                    resolve(p);
                },
            });

            conn.connect();

            const p = Particle.createNew(script, 5000, pid);

            await conn.sendParticle(p);
        });

        const res: any = await promise;
        const json = JSON.parse(res);
        expect(json.script).toBe(script);
    });
});
