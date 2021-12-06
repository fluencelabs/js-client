import each from 'jest-each';
import { CallServiceData } from '../../internal/commonTypes';
import { BuiltInServiceContext, builtInServices } from '../../internal/builtInServices';
import { KeyPair } from '../../internal/KeyPair';

const context = (async () => {
    const res: BuiltInServiceContext = {
        peerKeyPair: await KeyPair.randomEd25519(),
    };
    return res;
})();

describe('Tests for default handler', () => {
    // prettier-ignore
    each`
  serviceId | fnName               | args                           | retCode | result
  ${'op'}   | ${'identity'}        | ${[]}                          | ${0}    | ${{}}
  ${'op'}   | ${'identity'}        | ${[1]}                         | ${0}    | ${1}
  ${'op'}   | ${'identity'}        | ${[1, 2]}                      | ${1}    | ${'identity accepts up to 1 arguments, received 2 arguments'}

  ${'op'}   | ${'noop'}            | ${[1, 2]}                      | ${0}    | ${{}}

  ${'op'}   | ${'array'}           | ${[1, 2, 3]}                   | ${0}    | ${[1, 2, 3]}

  ${'op'}   | ${'concat'}          | ${[[1, 2], [3, 4], [5, 6]]}    | ${0}    | ${[1, 2, 3, 4, 5, 6]}
  ${'op'}   | ${'concat'}          | ${[[1, 2]]}                    | ${0}    | ${[1, 2]}
  ${'op'}   | ${'concat'}          | ${[]}                          | ${0}    | ${[]}
  ${'op'}   | ${'concat'}          | ${[1, [1, 2], 1]}              | ${1}    | ${"All arguments of 'concat' must be arrays: arguments 0, 2 are not"}

  ${'op'}   | ${'string_to_b58'}   | ${["test"]}                    | ${0}    | ${"3yZe7d"}
  ${'op'}   | ${'string_to_b58'}   | ${["test", 1]}                 | ${1}    | ${"string_to_b58 accepts only one string argument"}

  ${'op'}   | ${'string_from_b58'} | ${["3yZe7d"]}                  | ${0}    | ${"test"}
  ${'op'}   | ${'string_from_b58'} | ${["3yZe7d", 1]}               | ${1}    | ${"string_from_b58 accepts only one string argument"}

  ${'op'}   | ${'bytes_to_b58'}    | ${[[116, 101, 115, 116]]}      | ${0}    | ${"3yZe7d"}
  ${'op'}   | ${'bytes_to_b58'}    | ${[[116, 101, 115, 116], 1]}   | ${1}    | ${"bytes_to_b58 accepts only single argument: array of numbers"}

  ${'op'}   | ${'bytes_from_b58'}  | ${["3yZe7d"]}                  | ${0}    | ${[116, 101, 115, 116]}
  ${'op'}   | ${'bytes_from_b58'}  | ${["3yZe7d", 1]}               | ${1}    | ${"bytes_from_b58 accepts only one string argument"}

  ${'peer'} | ${'timeout'}         | ${[200, []]}                   | ${0}    | ${[]}}
  ${'peer'} | ${'timeout'}         | ${[200, ['test']]}             | ${0}    | ${['test']}}
  ${'peer'} | ${'timeout'}         | ${[]}                          | ${1}    | ${'timeout accepts exactly two arguments: timeout duration in ms and a message string'}}
  ${'peer'} | ${'timeout'}         | ${[200, 'test', 1]}            | ${1}    | ${'timeout accepts exactly two arguments: timeout duration in ms and a message string'}}
  
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
});
