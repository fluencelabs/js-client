import 'mocha';
import { expect } from 'chai';
import { createLocalClient } from './util';

describe('== AIR suite', () => {
    it('check init_peer_id', async function () {
        // arrange
        const serviceId = 'test_service';
        const fnName = 'return_first_arg';

        const client = await createLocalClient();

        let res;
        client.registerCallback(serviceId, fnName, (args, _) => {
            res = args[0];
            return res;
        });

        // act
        const script = `(call %init_peer_id% ("${serviceId}" "${fnName}") [%init_peer_id%])`;
        await client.sendScript(script);

        // assert
        expect(res).to.be.equal(client.selfPeerId);
    });

    it('call local function', async function () {
        // arrange
        const serviceId = 'test_service';
        const fnName = 'return_first_arg';

        const client = await createLocalClient();

        let res;
        client.registerCallback(serviceId, fnName, (args, _) => {
            res = args[0];
            return res;
        });

        // act
        const arg = 'hello';
        const script = `(call %init_peer_id% ("${serviceId}" "${fnName}") ["${arg}"])`;
        await client.sendScript(script);

        // assert
        expect(res).to.be.equal(arg);
    });

    it('check particle arguments', async function () {
        // arrange
        const serviceId = 'test_service';
        const fnName = 'return_first_arg';

        const client = await createLocalClient();

        let res;
        client.registerCallback(serviceId, fnName, (args, _) => {
            res = args[0];
            return res;
        });

        // act
        const script = `(call %init_peer_id% ("${serviceId}" "${fnName}") [arg1])`;
        const data = new Map();
        data.set('arg1', 'hello');
        await client.sendScript(script, data);

        // assert
        expect(res).to.be.equal('hello');
    });

    it('check security tetraplet', async function () {
        // arrange
        const makeDataServiceId = 'make_data_service';
        const makeDataFnName = 'make_data';
        const getDataServiceId = 'get_data_service';
        const getDataFnName = 'get_data';

        const client = await createLocalClient();

        client.registerCallback(makeDataServiceId, makeDataFnName, (args, _) => {
            return {
                field: 42,
            };
        });
        let res;
        client.registerCallback(getDataServiceId, getDataFnName, (args, tetraplets) => {
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
        await client.sendScript(script);

        // assert
        const tetraplet = res.tetraplets[0][0];
        expect(tetraplet).to.contain({
            service_id: 'make_data_service',
            function_name: 'make_data',
            json_path: '$.field',
        });
    });

    it('check chain of services work properly', async function () {
        this.timeout(5000);
        // arrange
        const client = await createLocalClient();

        const serviceId1 = 'check1';
        const fnName1 = 'fn1';
        let res1;
        client.registerCallback(serviceId1, fnName1, (args, _) => {
            res1 = args[0];
            return res1;
        });

        const serviceId2 = 'check2';
        const fnName2 = 'fn2';
        let res2;
        client.registerCallback(serviceId2, fnName2, (args, _) => {
            res2 = args[0];
            return res2;
        });

        const serviceId3 = 'check3';
        const fnName3 = 'fn3';
        let res3;
        client.registerCallback(serviceId3, fnName3, (args, _) => {
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
        await client.sendScript(script);

        // assert
        expect(res1).to.be.equal(arg1);
        expect(res2).to.be.equal(arg2);
        expect(res3).to.be.deep.equal([res1, res2]);
    });
});
