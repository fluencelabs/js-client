import each from 'jest-each';
import { CallServiceData } from '../../internal/CallServiceHandler';
import makeDefaultClientHandler from '../../internal/defaultClientHandler';

describe('Tests for default handler', () => {
    // prettier-ignore
    each`
  fnName               | args                           | retCode | result
  ${'identity'}        | ${[]}                          | ${0}    | ${{}}
  ${'identity'}        | ${[1]}                         | ${0}    | ${1}
  ${'identity'}        | ${[1, 2]}                      | ${1}    | ${'identity accepts up to 1 arguments, received 2 arguments'}
                           
  ${'noop'}            | ${[1, 2]}                      | ${0}    | ${{}}
                          
  ${'array'}           | ${[1, 2, 3]}                   | ${0}    | ${[1, 2, 3]}
        
  ${'concat'}          | ${[[1, 2], [3, 4], [5, 6]]}    | ${0}    | ${[1, 2, 3, 4, 5, 6]}
  ${'concat'}          | ${[[1, 2]]}                    | ${0}    | ${[1, 2]}
  ${'concat'}          | ${[]}                          | ${0}    | ${[]}
  ${'concat'}          | ${[1, [1, 2], 1]}              | ${1}    | ${"All arguments of 'concat' must be arrays: arguments 0, 2 are not"}

  ${'string_to_b58'}   | ${["test"]}                    | ${0}    | ${"3yZe7d"}
  ${'string_to_b58'}   | ${["test", 1]}                 | ${1}    | ${"string_to_b58 accepts only one string argument"}
  
  ${'string_from_b58'} | ${["3yZe7d"]}                  | ${0}    | ${"test"}
  ${'string_from_b58'} | ${["3yZe7d", 1]}               | ${1}    | ${"string_from_b58 accepts only one string argument"}
  
  ${'bytes_to_b58'}    | ${[[116, 101, 115, 116]]}      | ${0}    | ${"3yZe7d"}
  ${'bytes_to_b58'}    | ${[[116, 101, 115, 116], 1]}   | ${1}    | ${"bytes_to_b58 accepts only single argument: array of numbers"}
  
  ${'bytes_from_b58'}  | ${["3yZe7d"]}                  | ${0}    | ${[116, 101, 115, 116]}
  ${'bytes_from_b58'}  | ${["3yZe7d", 1]}               | ${1}    | ${"bytes_from_b58 accepts only one string argument"}

`.test(
        //
        '$fnName with $args expected retcode: $retCode and result: $result',
        ({ fnName, args, retCode, result }) => {
            // arrange
            const req: CallServiceData = {
                serviceId: 'op',
                fnName: fnName,
                args: args,
                tetraplets: [],
                particleContext: {
                    particleId: 'some',
                },
            };

            // act
            const res = makeDefaultClientHandler().execute(req);

            // assert
            expect(res).toMatchObject({
                retCode: retCode,
                result: result,
            });
            const handler = makeDefaultClientHandler();
        },
    );
});
