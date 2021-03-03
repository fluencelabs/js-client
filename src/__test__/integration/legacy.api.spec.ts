import {
    createClient,
    Particle,
    FluenceClient,
    sendParticle,
    registerServiceFunction,
    subscribeToEvent,
    sendParticleAsFetch,
} from '../../api';
import { nodes } from '../connection';

let client: FluenceClient;

describe('Legacy api suite', () => {
    it('sendParticle', async () => {
        client = await createClient(nodes[0]);

        const result = new Promise((resolve) => {
            subscribeToEvent(client, 'callback', 'callback', (args) => {
                resolve(args[0]);
            });
        });

        const script = `(seq 
            (call init_relay ("op" "identity") [])
            (call %init_peer_id% ("callback" "callback") [arg])
        )`;

        const data = {
            arg: 'hello world!',
        };

        await sendParticle(client, new Particle(script, data, 7000));

        expect(await result).toBe('hello world!');
    });

    it('sendParticle Error', async () => {
        client = await createClient(nodes[0]);

        const script = `
            (call init_relay ("incorrect" "service") [])
            `;

        const promise = new Promise((resolve, reject) => {
            sendParticle(client, new Particle(script), reject);
        });

        await expect(promise).rejects.toMatchObject({
            error: expect.stringContaining("Service with id 'incorrect' not found"),
            instruction: expect.stringContaining('incorrect'),
        });
    });

    it('sendParticleAsFetch', async () => {
        client = await createClient(nodes[0]);

        const script = `(seq 
            (call init_relay ("op" "identity") [])
            (call %init_peer_id% ("service" "fn") [arg])
        )`;

        const data = {
            arg: 'hello world!',
        };

        const [result] = await sendParticleAsFetch<[string]>(client, new Particle(script, data, 7000), 'fn', 'service');

        expect(result).toBe('hello world!');
    });

    it('sendParticleAsFetch Error', async () => {
        client = await createClient(nodes[0]);

        const script = `
            (call init_relay ("incorrect" "service") [])
            `;

        const promise = sendParticleAsFetch<[string]>(client, new Particle(script), 'fn', 'service');

        await expect(promise).rejects.toMatchObject({
            error: expect.stringContaining("Service with id 'incorrect' not found"),
            instruction: expect.stringContaining('incorrect'),
        });
    });

    it('registerServiceFunction', async () => {
        client = await createClient(nodes[0]);

        registerServiceFunction(client, 'service', 'fn', (args) => {
            return { res: args[0] + ' world!' };
        });

        const script = `(seq 
            (call %init_peer_id% ("service" "fn") ["hello"] result)
            (call %init_peer_id% ("callback" "callback") [result])
        )`;

        const [result] = await sendParticleAsFetch<[string]>(
            client,
            new Particle(script, {}, 7000),
            'callback',
            'callback',
        );

        expect(result).toEqual({ res: 'hello world!' });
    });

    it('subscribeToEvent', async () => {
        client = await createClient(nodes[0]);

        const promise = new Promise((resolve) => {
            subscribeToEvent(client, 'service', 'fn', (args) => {
                resolve(args[0] + ' world!');
            });
        });

        const script = `
            (call %init_peer_id% ("service" "fn") ["hello"])
        `;

        await sendParticle(client, new Particle(script, {}, 7000));

        const result = await promise;
        expect(result).toBe('hello world!');
    });
});
