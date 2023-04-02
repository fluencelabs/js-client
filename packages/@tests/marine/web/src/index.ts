import { MarineBackgroundRunner } from '@fluencelabs/marine.background-runner';
import { InlinedWorkerLoader, WasmWebLoader } from '@fluencelabs/marine.deps-loader.web';
import { callAvm, JSONArray, JSONObject } from '@fluencelabs/avm';
import { toUint8Array } from 'js-base64';

const vmPeerId = '12D3KooWNzutuy8WHXDKFqFsATvCR6j9cj2FijYbnd47geRKaQZS';

const b = (s: string) => {
    return toUint8Array(s);
};

const main = async () => {
    const avm = new WasmWebLoader('avm.wasm');
    const control = new WasmWebLoader('marine-js.wasm');
    const worker = new InlinedWorkerLoader();
    const runner = new MarineBackgroundRunner(worker, control, () => {});

    await runner.start();
    await avm.start();
    const avmVal = await avm.getValue();
    await runner.createService(avmVal, 'avm');

    const s = `(seq
            (par 
                (call "${vmPeerId}" ("local_service_id" "local_fn_name") [] result_1)
                (call "remote_peer_id" ("service_id" "fn_name") [] g)
            )
            (call "${vmPeerId}" ("local_service_id" "local_fn_name") [] result_2)
        )`;

    // act
    const res = await callAvm(
        (args: JSONArray | JSONObject) => runner.callService('avm', 'invoke', args, undefined),
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
    await runner.stop();

    return res;
};

// @ts-ignore
window.MAIN = main;
