import { createClient, FluenceClient } from '../../FluenceClient';
import { RequestFlow } from '../../internal/RequestFlow';
import { RequestFlowBuilder } from '../../internal/RequestFlowBuilder';

let client: FluenceClient;

describe('== AIR suite', () => {
    afterEach(async () => {
        if (client) {
            await client.disconnect();
        }
    });

    it('check init_peer_id', async function () {
        // arrange
        const serviceId = 'test_service';
        const fnName = 'return_first_arg';
        const script = `(call %init_peer_id% ("${serviceId}" "${fnName}") [%init_peer_id%])`;

        // prettier-ignore
        const [request, promise] = new RequestFlowBuilder()
            .withDefaults()
            .withRawScript(script)
            .buildAsFetch<string[]>(serviceId, fnName);

        // act
        client = await createClient();
        await client.initiateFlow(request);
        const [result] = await promise;

        // assert
        expect(result).toBe(client.selfPeerId);
    });

    it('call local function', async function () {
        // arrange
        const serviceId = 'test_service';
        const fnName = 'return_first_arg';

        client = await createClient();

        let res;
        client.aquaCallHandler.on(serviceId, fnName, (args, _) => {
            res = args[0];
            return res;
        });

        // act
        const arg = 'hello';
        const script = `(call %init_peer_id% ("${serviceId}" "${fnName}") ["${arg}"])`;
        await client.initiateFlow(RequestFlow.createLocal(script));

        // assert
        expect(res).toEqual(arg);
    });

    describe('error handling', () => {
        it('call broken script', async function () {
            // arrange
            const script = `(incorrect)`;
            // prettier-ignore
            const [request, error] = new RequestFlowBuilder()
                .withDefaults()
                .withRawScript(script)
                .buildWithErrorHandling();

            // act
            client = await createClient();
            await client.initiateFlow(request);

            // assert
            await expect(error).rejects.toContain("aqua script can't be parsed");
        });

        it('call script without ttl', async function () {
            // arrange
            const script = `(null)`;
            // prettier-ignore
            const [request, promise] = new RequestFlowBuilder()
                .withDefaults()
                .withTTL(1)
                .withRawScript(script)
                .buildAsFetch();

            // act
            client = await createClient();
            await client.initiateFlow(request);

            // assert
            await expect(promise).rejects.toContain('Timed out after');
        });
    });

    it('check particle arguments', async function () {
        // arrange
        const serviceId = 'test_service';
        const fnName = 'return_first_arg';
        const script = `(call %init_peer_id% ("${serviceId}" "${fnName}") [arg1])`;

        // prettier-ignore
        const [request, promise] = new RequestFlowBuilder()
            .withDefaults()
            .withRawScript(script)
            .withVariable('arg1', 'hello')
            .buildAsFetch<string[]>(serviceId, fnName);

        // act
        client = await createClient();
        await client.initiateFlow(request);
        const [result] = await promise;

        // assert
        expect(result).toEqual('hello');
    });

    it('check security tetraplet', async function () {
        // arrange
        const makeDataServiceId = 'make_data_service';
        const makeDataFnName = 'make_data';
        const getDataServiceId = 'get_data_service';
        const getDataFnName = 'get_data';

        client = await createClient();

        client.aquaCallHandler.on(makeDataServiceId, makeDataFnName, (args, _) => {
            return {
                field: 42,
            };
        });
        let res;
        client.aquaCallHandler.on(getDataServiceId, getDataFnName, (args, tetraplets) => {
            res = {
                args: args,
                tetraplets: tetraplets,
            };
            return args[0];
        });

        // act
        const script = `
        (seq
            (call %init_peer_id% ("${makeDataServiceId}" "${makeDataFnName}") [] result)
            (call %init_peer_id% ("${getDataServiceId}" "${getDataFnName}") [result.$.field])
        )`;
        await client.initiateFlow(new RequestFlowBuilder().withDefaults().withRawScript(script).build());

        // assert
        const tetraplet = res.tetraplets[0][0];
        expect(tetraplet).toMatchObject({
            service_id: 'make_data_service',
            function_name: 'make_data',
            json_path: '$.field',
        });
    });

    it('check chain of services work properly', async function () {
        // arrange
        client = await createClient();

        const serviceId1 = 'check1';
        const fnName1 = 'fn1';
        let res1;
        client.aquaCallHandler.on(serviceId1, fnName1, (args, _) => {
            res1 = args[0];
            return res1;
        });

        const serviceId2 = 'check2';
        const fnName2 = 'fn2';
        let res2;
        client.aquaCallHandler.on(serviceId2, fnName2, (args, _) => {
            res2 = args[0];
            return res2;
        });

        const serviceId3 = 'check3';
        const fnName3 = 'fn3';
        let res3;
        client.aquaCallHandler.on(serviceId3, fnName3, (args, _) => {
            res3 = args;
            return res3;
        });

        const arg1 = 'arg1';
        const arg2 = 'arg2';

        // act
        const script = `(seq
                       (seq
                        (call %init_peer_id% ("${serviceId1}" "${fnName1}") ["${arg1}"] result1)
                        (call %init_peer_id% ("${serviceId2}" "${fnName2}") ["${arg2}"] result2))
                       (call %init_peer_id% ("${serviceId3}" "${fnName3}") [result1 result2]))
        `;
        await client.initiateFlow(new RequestFlowBuilder().withDefaults().withRawScript(script).build());

        // assert
        expect(res1).toEqual(arg1);
        expect(res2).toEqual(arg2);
        expect(res3).toEqual([res1, res2]);
    });
});
