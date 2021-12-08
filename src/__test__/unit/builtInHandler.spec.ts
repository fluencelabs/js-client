import each from 'jest-each';
import { CallServiceData } from '../../internal/commonTypes';
import { BuiltInServiceContext, builtInServices } from '../../internal/builtInServices';
import { KeyPair } from '../../internal/KeyPair';
import { toUint8Array } from 'js-base64';

const key = '+cmeYlZKj+MfSa9dpHV+BmLPm6wq4inGlsPlQ1GvtPk=';

const context = (async () => {
    const keyBytes = toUint8Array(key);
    const kp = await KeyPair.fromEd25519SK(keyBytes);
    const res: BuiltInServiceContext = {
        peerKeyPair: kp,
        peerId: kp.Libp2pPeerId.toB58String(),
    };
    return res;
})();

const testData = [1, 2, 3, 4, 5, 6, 7, 9, 10];
const testDataSig = [
    224, 104, 245, 206, 140, 248, 27, 72, 68, 133, 111, 10, 164, 197, 242, 132, 107, 77, 224, 67, 99, 106, 76, 29, 144,
    121, 122, 169, 36, 173, 58, 80, 170, 102, 137, 253, 157, 247, 168, 87, 162, 223, 188, 214, 203, 220, 52, 246, 29,
    86, 77, 71, 224, 248, 16, 213, 254, 75, 78, 239, 243, 222, 241, 15,
];

const testDataWrongSig = [
    116, 247, 189, 118, 236, 53, 147, 123, 219, 75, 176, 105, 101, 108, 233, 137, 97, 14, 146, 132, 252, 70, 51, 153,
    237, 167, 156, 150, 36, 90, 229, 108, 166, 231, 255, 137, 8, 246, 125, 0, 213, 150, 83, 196, 237, 221, 131, 159,
    157, 159, 25, 109, 95, 160, 181, 65, 254, 238, 47, 156, 240, 151, 58, 14,
];

describe('Tests for default handler', () => {
    // prettier-ignore
    each`
  serviceId     | fnName               | args                            | retCode | result
  ${'op'}       | ${'identity'}        | ${[]}                           | ${0}    | ${{}}
  ${'op'}       | ${'identity'}        | ${[1]}                          | ${0}    | ${1}
  ${'op'}       | ${'identity'}        | ${[1, 2]}                       | ${1}    | ${'identity accepts up to 1 arguments, received 2 arguments'}
     
  ${'op'}       | ${'noop'}            | ${[1, 2]}                       | ${0}    | ${{}}
     
  ${'op'}       | ${'array'}           | ${[1, 2, 3]}                    | ${0}    | ${[1, 2, 3]}
     
  ${'op'}       | ${'concat'}          | ${[[1, 2], [3, 4], [5, 6]]}     | ${0}    | ${[1, 2, 3, 4, 5, 6]}
  ${'op'}       | ${'concat'}          | ${[[1, 2]]}                     | ${0}    | ${[1, 2]}
  ${'op'}       | ${'concat'}          | ${[]}                           | ${0}    | ${[]}
  ${'op'}       | ${'concat'}          | ${[1, [1, 2], 1]}               | ${1}    | ${"All arguments of 'concat' must be arrays: arguments 0, 2 are not"}
     
  ${'op'}       | ${'string_to_b58'}   | ${["test"]}                     | ${0}    | ${"3yZe7d"}
  ${'op'}       | ${'string_to_b58'}   | ${["test", 1]}                  | ${1}    | ${"string_to_b58 accepts only one string argument"}
     
  ${'op'}       | ${'string_from_b58'} | ${["3yZe7d"]}                   | ${0}    | ${"test"}
  ${'op'}       | ${'string_from_b58'} | ${["3yZe7d", 1]}                | ${1}    | ${"string_from_b58 accepts only one string argument"}
     
  ${'op'}       | ${'bytes_to_b58'}    | ${[[116, 101, 115, 116]]}       | ${0}    | ${"3yZe7d"}
  ${'op'}       | ${'bytes_to_b58'}    | ${[[116, 101, 115, 116], 1]}    | ${1}    | ${"bytes_to_b58 accepts only single argument: array of numbers"}
     
  ${'op'}       | ${'bytes_from_b58'}  | ${["3yZe7d"]}                   | ${0}    | ${[116, 101, 115, 116]}
  ${'op'}       | ${'bytes_from_b58'}  | ${["3yZe7d", 1]}                | ${1}    | ${"bytes_from_b58 accepts only one string argument"}
     
  ${'peer'}     | ${'timeout'}         | ${[200, []]}                    | ${0}    | ${[]}}
  ${'peer'}     | ${'timeout'}         | ${[200, ['test']]}              | ${0}    | ${['test']}}
  ${'peer'}     | ${'timeout'}         | ${[]}                           | ${1}    | ${'timeout accepts exactly two arguments: timeout duration in ms and a message string'}}
  ${'peer'}     | ${'timeout'}         | ${[200, 'test', 1]}             | ${1}    | ${'timeout accepts exactly two arguments: timeout duration in ms and a message string'}}
   
  ${'security'} | ${'verify'}          | ${[testData, testDataSig]}      | ${0}    | ${true}}
  ${'security'} | ${'verify'}          | ${[testData, testDataWrongSig]} | ${0}    | ${false}}
  ${'security'} | ${'sign'}            | ${[]}                           | ${1}    | ${'sign accepts exactly one argument: data be signed in format of u8 array of bytes'}}
  ${'security'} | ${'verify'}          | ${[testData]}                   | ${1}    | ${'verify accepts exactly two arguments: data and signature, both in format of u8 array of bytes'}}
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
            const fn = builtInServices(await context)[req.serviceId][req.fnName];
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
        const fn = builtInServices(await context)[req.serviceId][req.fnName];
        const res = await fn(req);

        // assert
        expect(res).toMatchObject({
            retCode: 1,
            result: 'The JS implementation of Peer does not support identify',
        });
    });

    it('sign should work', async () => {
        // arrange
        const ctx = await context;
        const req: CallServiceData = {
            serviceId: 'security',
            fnName: 'sign',
            args: [testData],
            tetraplets: [
                [
                    {
                        function_name: 'get_trust_bytes',
                        json_path: '',
                        peer_pk: '',
                        service_id: 'trust-graph',
                    },
                ],
            ],
            particleContext: {
                particleId: 'some',
                initPeerId: ctx.peerId,
                timestamp: 595951200,
                ttl: 595961200,
                signature: 'sig',
            },
        };

        // act
        const fn = builtInServices(ctx)[req.serviceId][req.fnName];
        const res = await fn(req);

        // assert
        expect(res).toMatchObject({
            retCode: 0,
            result: testDataSig,
        });
    });
});
