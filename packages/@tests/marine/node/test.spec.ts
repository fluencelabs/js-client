import { loadDefaults } from '@fluencelabs/marine-deps-loader';
import { MarineBackgroundRunner } from '@fluencelabs/marine-runner';
import { callAvm, JSONArray, JSONObject } from '@fluencelabs/avm';

const vmPeerId = '12D3KooWNzutuy8WHXDKFqFsATvCR6j9cj2FijYbnd47geRKaQZS';

const b = (s: string) => {
    return Buffer.from(s);
};

describe('Nodejs integration tests', () => {
    it('Smoke test', async () => {
        let runner: MarineBackgroundRunner | null = null;
        try {
            // arrange
            const { avm, marine, worker } = await loadDefaults();
            runner = new MarineBackgroundRunner(worker, () => {});

            await runner.init(marine);
            await runner.createService(avm, 'avm');

            const s = `(seq
            (par 
                (call "${vmPeerId}" ("local_service_id" "local_fn_name") [] result_1)
                (call "remote_peer_id" ("service_id" "fn_name") [] g)
            )
            (call "${vmPeerId}" ("local_service_id" "local_fn_name") [] result_2)
        )`;

            // act
            const res = await callAvm(
                (args: JSONArray | JSONObject): unknown => runner!.callService('avm', 'invoke', args, undefined),
                {
                    currentPeerId: vmPeerId,
                    initPeerId: vmPeerId,
                    timestamp: Date.now(),
                    ttl: 10000,
                },
                s,
                b(''),
                b(''),
                [],
            );
            await runner.terminate();

            // assert
            expect(res).toMatchObject({
                retCode: 0,
                errorMessage: '',
            });
        } finally {
            runner?.terminate();
        }
    });
});
