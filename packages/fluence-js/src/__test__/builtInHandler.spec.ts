import { CallParams, CallServiceData } from '../internal/commonTypes';
import each from 'jest-each';
import { builtInServices } from '../internal/builtins/common';

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
            retCode: 1,
            result: 'The JS implementation of Peer does not support "peer.identify"',
        });
    });
});
