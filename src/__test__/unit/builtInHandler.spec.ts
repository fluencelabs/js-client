import { CallParams, CallServiceData } from '../../internal/commonTypes';
import each from 'jest-each';
import { builtInServices } from '../../internal/builtins/common';
import { KeyPair } from '../../internal/KeyPair';
import { Sig, defaultSigGuard, allowServiceFn } from '../../internal/builtins/Sig';
import { toUint8Array } from 'js-base64';

const a10b20 = `{
    "a": 10,
    "b": 20
}`;

const oneTwoThreeFour = `[
    1,
    2,
    3,
    4
]`;

describe('Tests for default handler', () => {
    // prettier-ignore
    each`
  serviceId     | fnName               | args                                      | retCode | result
  ${'op'}       | ${'identity'}        | ${[]}                                     | ${0}    | ${{}}
  ${'op'}       | ${'identity'}        | ${[1]}                                    | ${0}    | ${1}
  ${'op'}       | ${'identity'}        | ${[1, 2]}                                 | ${1}    | ${'identity accepts up to 1 arguments, received 2 arguments'}
     
  ${'op'}       | ${'noop'}            | ${[1, 2]}                                 | ${0}    | ${{}}
     
  ${'op'}       | ${'array'}           | ${[1, 2, 3]}                              | ${0}    | ${[1, 2, 3]}
  
  ${'op'}       | ${'array_length'}    | ${[[1, 2, 3]]}                            | ${0}    | ${3}
  ${'op'}       | ${'array_length'}    | ${[]}                                     | ${1}    | ${'array_length accepts exactly one argument, found: 0'}
     
  ${'op'}       | ${'concat'}          | ${[[1, 2], [3, 4], [5, 6]]}               | ${0}    | ${[1, 2, 3, 4, 5, 6]}
  ${'op'}       | ${'concat'}          | ${[[1, 2]]}                               | ${0}    | ${[1, 2]}
  ${'op'}       | ${'concat'}          | ${[]}                                     | ${0}    | ${[]}
  ${'op'}       | ${'concat'}          | ${[1, [1, 2], 1]}                         | ${1}    | ${"All arguments of 'concat' must be arrays: arguments 0, 2 are not"}
     
  ${'op'}       | ${'string_to_b58'}   | ${["test"]}                               | ${0}    | ${"3yZe7d"}
  ${'op'}       | ${'string_to_b58'}   | ${["test", 1]}                            | ${1}    | ${"string_to_b58 accepts only one string argument"}
     
  ${'op'}       | ${'string_from_b58'} | ${["3yZe7d"]}                             | ${0}    | ${"test"}
  ${'op'}       | ${'string_from_b58'} | ${["3yZe7d", 1]}                          | ${1}    | ${"string_from_b58 accepts only one string argument"}
     
  ${'op'}       | ${'bytes_to_b58'}    | ${[[116, 101, 115, 116]]}                 | ${0}    | ${"3yZe7d"}
  ${'op'}       | ${'bytes_to_b58'}    | ${[[116, 101, 115, 116], 1]}              | ${1}    | ${"bytes_to_b58 accepts only single argument: array of numbers"}
     
  ${'op'}       | ${'bytes_from_b58'}  | ${["3yZe7d"]}                             | ${0}    | ${[116, 101, 115, 116]}
  ${'op'}       | ${'bytes_from_b58'}  | ${["3yZe7d", 1]}                          | ${1}    | ${"bytes_from_b58 accepts only one string argument"}

  ${'op'}       | ${'sha256_string'}   | ${["hello, world!"]}                      | ${0}    | ${"QmVQ8pg6L1tpoWYeq6dpoWqnzZoSLCh7E96fCFXKvfKD3u"}
  ${'op'}       | ${'sha256_string'}   | ${["hello, world!", true]}                | ${0}    | ${"84V7ZxLW7qKsx1Qvbd63BdGaHxUc3TfT2MBPqAXM7Wyu"}
  ${'op'}       | ${'sha256_string'}   | ${[]}                                     | ${1}    | ${"sha256_string accepts 1-3 arguments, found: 0"}

  ${'op'}       | ${'concat_strings'}  | ${[]}                                     | ${0}    | ${""}
  ${'op'}       | ${'concat_strings'}  | ${["a", "b", "c"]}                        | ${0}    | ${"abc"}
     
  ${'peer'}     | ${'timeout'}         | ${[200, []]}                              | ${0}    | ${[]}}
  ${'peer'}     | ${'timeout'}         | ${[200, ['test']]}                        | ${0}    | ${['test']}}
  ${'peer'}     | ${'timeout'}         | ${[]}                                     | ${1}    | ${'timeout accepts exactly two arguments: timeout duration in ms and a message string'}}
  ${'peer'}     | ${'timeout'}         | ${[200, 'test', 1]}                       | ${1}    | ${'timeout accepts exactly two arguments: timeout duration in ms and a message string'}}

  ${'debug'}    | ${'stringify'}       | ${[]}                                     | ${0}    | ${'"<empty argument list>"'}}
  ${'debug'}    | ${'stringify'}       | ${[{a: 10, b: 20}]}                       | ${0}    | ${a10b20}}
  ${'debug'}    | ${'stringify'}       | ${[1, 2, 3, 4]}                           | ${0}    | ${oneTwoThreeFour}}
  
  ${'math'}     | ${'add'}"            | ${[2, 2]}                                 | ${0}    | ${4}
  ${'math'}     | ${'add'}"            | ${[2]}                                    | ${1}    | ${"Expected 2 argument(s). Got 1"}

  ${'math'}     | ${'sub'}"            | ${[2, 2]}                                 | ${0}    | ${0}
  ${'math'}     | ${'sub'}"            | ${[2, 3]}                                 | ${0}    | ${-1}

  ${'math'}     | ${'mul'}"            | ${[2, 2]}                                 | ${0}    | ${4}
  ${'math'}     | ${'mul'}"            | ${[2, 0]}                                 | ${0}    | ${0}
  ${'math'}     | ${'mul'}"            | ${[2, -1]}                                | ${0}    | ${-2}

  ${'math'}     | ${'fmul'}"           | ${[10, 0.66]}                             | ${0}    | ${6}
  ${'math'}     | ${'fmul'}"           | ${[0.5, 0.5]}                             | ${0}    | ${0}
  ${'math'}     | ${'fmul'}"           | ${[100.5, 0.5]}                           | ${0}    | ${50}

  ${'math'}     | ${'div'}"            | ${[2, 2]}                                 | ${0}    | ${1}
  ${'math'}     | ${'div'}"            | ${[2, 3]}                                 | ${0}    | ${0}
  ${'math'}     | ${'div'}"            | ${[10, 5]}                                | ${0}    | ${2}

  ${'math'}     | ${'rem'}"            | ${[10, 3]}                                | ${0}    | ${1}

  ${'math'}     | ${'pow'}"            | ${[2, 2]}                                 | ${0}    | ${4}
  ${'math'}     | ${'pow'}"            | ${[2, 0]}                                 | ${0}    | ${1}

  ${'math'}     | ${'log'}"            | ${[2, 2]}                                 | ${0}    | ${1}
  ${'math'}     | ${'log'}"            | ${[2, 4]}                                 | ${0}    | ${2}

  ${'cmp'}      | ${'gt'}"             | ${[2, 4]}                                 | ${0}    | ${false}
  ${'cmp'}      | ${'gte'}"            | ${[2, 4]}                                 | ${0}    | ${false}
  ${'cmp'}      | ${'gte'}"            | ${[4, 2]}                                 | ${0}    | ${true}
  ${'cmp'}      | ${'gte'}"            | ${[2, 2]}                                 | ${0}    | ${true}

  ${'cmp'}      | ${'lt'}"             | ${[2, 4]}                                 | ${0}    | ${true}
  ${'cmp'}      | ${'lte'}"            | ${[2, 4]}                                 | ${0}    | ${true}
  ${'cmp'}      | ${'lte'}"            | ${[4, 2]}                                 | ${0}    | ${false}
  ${'cmp'}      | ${'lte'}"            | ${[2, 2]}                                 | ${0}    | ${true}

  ${'cmp'}      | ${'cmp'}"            | ${[2, 4]}                                 | ${0}    | ${-1}
  ${'cmp'}      | ${'cmp'}"            | ${[2, -4]}                                | ${0}    | ${1}
  ${'cmp'}      | ${'cmp'}"            | ${[2, 2]}                                 | ${0}    | ${0}

  ${'array'}    | ${'sum'}"            | ${[[1, 2, 3]]}                            | ${0}    | ${6}
  ${'array'}    | ${'dedup'}"          | ${[["a", "a", "b", "c", "a", "b", "c"]]}  | ${0}    | ${["a", "b", "c"]}
  ${'array'}    | ${'intersect'}"      | ${[["a", "b", "c"], ["c", "b", "d"]]}     | ${0}    | ${["b", "c"]}
  ${'array'}    | ${'diff'}"           | ${[["a", "b", "c"], ["c", "b", "d"]]}     | ${0}    | ${["a"]}
  ${'array'}    | ${'sdiff'}"          | ${[["a", "b", "c"], ["c", "b", "d"]]}     | ${0}    | ${["a", "d"]}

  `.test(
        //
        '$fnName with $args expected retcode: $retCode and result: $result',
        async ({ serviceId, fnName, args, retCode, result }) => {
            // arrange
            const req: CallServiceData = {
                serviceId: serviceId,
                fnName: fnName,
                args: args,
                tetraplets: [],
                particleContext: {
                    particleId: 'some',
                    initPeerId: 'init peer id',
                    timestamp: 595951200,
                    ttl: 595961200,
                    signature: 'sig',
                },
            };

            // act
            const fn = builtInServices[req.serviceId][req.fnName];
            const res = await fn(req);

            // assert
            expect(res).toMatchObject({
                retCode: retCode,
                result: result,
            });
        },
    );

    it('should return correct error message for identiy service', async () => {
        // arrange
        const req: CallServiceData = {
            serviceId: 'peer',
            fnName: 'identify',
            args: [],
            tetraplets: [],
            particleContext: {
                particleId: 'some',
                initPeerId: 'init peer id',
                timestamp: 595951200,
                ttl: 595961200,
                signature: 'sig',
            },
        };

        // act
        const fn = builtInServices[req.serviceId][req.fnName];
        const res = await fn(req);

        // assert
        expect(res).toMatchObject({
            retCode: 0,
            result: {
                external_addresses: [],
                node_version: expect.stringContaining('js'),
                air_version: expect.stringContaining('js'),
            },
        });
    });
});

const key = '+cmeYlZKj+MfSa9dpHV+BmLPm6wq4inGlsPlQ1GvtPk=';

const context = (async () => {
    const keyBytes = toUint8Array(key);
    const kp = await KeyPair.fromEd25519SK(keyBytes);
    const res = {
        peerKeyPair: kp,
        peerId: kp.Libp2pPeerId.toB58String(),
    };
    return res;
})();

const testData = [1, 2, 3, 4, 5, 6, 7, 9, 10];

// signature produced by KeyPair created from key above (`key` variable)
const testDataSig = [
    224, 104, 245, 206, 140, 248, 27, 72, 68, 133, 111, 10, 164, 197, 242, 132, 107, 77, 224, 67, 99, 106, 76, 29, 144,
    121, 122, 169, 36, 173, 58, 80, 170, 102, 137, 253, 157, 247, 168, 87, 162, 223, 188, 214, 203, 220, 52, 246, 29,
    86, 77, 71, 224, 248, 16, 213, 254, 75, 78, 239, 243, 222, 241, 15,
];

// signature produced by KeyPair created from some random KeyPair
const testDataWrongSig = [
    116, 247, 189, 118, 236, 53, 147, 123, 219, 75, 176, 105, 101, 108, 233, 137, 97, 14, 146, 132, 252, 70, 51, 153,
    237, 167, 156, 150, 36, 90, 229, 108, 166, 231, 255, 137, 8, 246, 125, 0, 213, 150, 83, 196, 237, 221, 131, 159,
    157, 159, 25, 109, 95, 160, 181, 65, 254, 238, 47, 156, 240, 151, 58, 14,
];

const makeTetraplet = (initPeerId: string, serviceId?: string, fnName?: string): CallParams<'data'> => {
    return {
        initPeerId: initPeerId,
        tetraplets: {
            data: [
                {
                    function_name: fnName,
                    service_id: serviceId,
                },
            ],
        },
    } as any;
};

describe('Sig service tests', () => {
    it('sig.sign should create the correct signature', async () => {
        const ctx = await context;
        const sig = new Sig(ctx.peerKeyPair);

        const res = await sig.sign(testData, makeTetraplet(ctx.peerId));

        expect(res.success).toBe(true);
        expect(res.signature).toStrictEqual(testDataSig);
    });

    it('sig.verify should return true for the correct signature', async () => {
        const ctx = await context;
        const sig = new Sig(ctx.peerKeyPair);

        const res = await sig.verify(testDataSig, testData);

        expect(res).toBe(true);
    });

    it('sig.verify should return false for the incorrect signature', async () => {
        const ctx = await context;
        const sig = new Sig(ctx.peerKeyPair);

        const res = await sig.verify(testDataWrongSig, testData);

        expect(res).toBe(false);
    });

    it('sign-verify call chain should work', async () => {
        const ctx = await context;
        const sig = new Sig(ctx.peerKeyPair);

        const signature = await sig.sign(testData, makeTetraplet(ctx.peerId));
        const res = await sig.verify(signature.signature as number[], testData);

        expect(res).toBe(true);
    });

    it('sig.sign with defaultSigGuard should work for correct callParams', async () => {
        const ctx = await context;
        const sig = new Sig(ctx.peerKeyPair);
        sig.securityGuard = defaultSigGuard(ctx.peerId);

        const signature = await sig.sign(testData, makeTetraplet(ctx.peerId, 'registry', 'get_route_bytes'));

        await expect(signature).toBeDefined();
    });

    it('sig.sign with defaultSigGuard should not allow particles initiated from incorrect service', async () => {
        const ctx = await context;
        const sig = new Sig(ctx.peerKeyPair);
        sig.securityGuard = defaultSigGuard(ctx.peerId);

        const res = await sig.sign(testData, makeTetraplet(ctx.peerId, 'other_service', 'other_fn'));

        await expect(res.success).toBe(false);
        await expect(res.error).toBe('Security guard validation failed');
    });

    it('sig.sign with defaultSigGuard should not allow particles initiated from other peers', async () => {
        const ctx = await context;
        const sig = new Sig(ctx.peerKeyPair);
        sig.securityGuard = defaultSigGuard(ctx.peerId);

        const res = await sig.sign(
            testData,
            makeTetraplet((await KeyPair.randomEd25519()).toB58String(), 'registry', 'get_key_bytes'),
        );

        await expect(res.success).toBe(false);
        await expect(res.error).toBe('Security guard validation failed');
    });

    it('changing securityGuard should work', async () => {
        const ctx = await context;
        const sig = new Sig(ctx.peerKeyPair);
        sig.securityGuard = allowServiceFn('test', 'test');

        const successful1 = await sig.sign(testData, makeTetraplet(ctx.peerId, 'test', 'test'));
        const unSuccessful1 = await sig.sign(testData, makeTetraplet(ctx.peerId, 'wrong', 'wrong'));

        sig.securityGuard = allowServiceFn('wrong', 'wrong');

        const successful2 = await sig.sign(testData, makeTetraplet(ctx.peerId, 'wrong', 'wrong'));
        const unSuccessful2 = await sig.sign(testData, makeTetraplet(ctx.peerId, 'test', 'test'));

        expect(successful1.success).toBe(true);
        expect(successful2.success).toBe(true);
        expect(unSuccessful1.success).toBe(false);
        expect(unSuccessful2.success).toBe(false);
    });
});
