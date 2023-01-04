import { MarineBackgroundRunner } from '@fluencelabs/marine.background-runner';
import { InlinedWorkerLoader, WasmNpmLoader } from '@fluencelabs/marine.deps-loader.node';
import { callAvm, JSONArray, JSONObject } from '@fluencelabs/avm';

const vmPeerId = '12D3KooWNzutuy8WHXDKFqFsATvCR6j9cj2FijYbnd47geRKaQZS';

const b = (s: string) => {
    return Buffer.from(s);
};

describe('Nodejs integration tests', () => {
    it('Smoke test', async () => {
        let runner: MarineBackgroundRunner | undefined = undefined;
        try {
            // arrange
            const avm = new WasmNpmLoader('@fluencelabs/avm', 'avm.wasm');
            const control = new WasmNpmLoader('@fluencelabs/marine-js', 'marine-js.wasm');
            const worker = new InlinedWorkerLoader();
            runner = new MarineBackgroundRunner(worker, control, () => {});

            await avm.start();

            await runner.start();
            await runner.createService(avm.getValue(), 'avm');

            const s = `(seq
            (par 
                (call "${vmPeerId}" ("local_service_id" "local_fn_name") [] result_1)
                (call "remote_peer_id" ("service_id" "fn_name") [] g)
            )
            (call "${vmPeerId}" ("local_service_id" "local_fn_name") [] result_2)
        )`;

            // act
            const res = await callAvm(
                (args: JSONArray | JSONObject) => runner!.callService('avm', 'invoke', args, undefined),
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

            // assert
            expect(res).toMatchObject({
                retCode: 0,
                errorMessage: '',
            });
        } finally {
            runner?.stop();
        }
    });
});
