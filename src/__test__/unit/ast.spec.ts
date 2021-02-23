import { parseAIR } from '../../internal/stepper';

describe('== AST parsing suite', () => {
    it('parse simple script and return ast', async function () {
        let ast = await parseAIR(`
            (call node ("service" "function") [1 2 3 arg] output)
        `);

        ast = JSON.parse(ast);

        expect(ast).toEqual({
            Call: {
                peer_part: { PeerPk: { Variable: 'node' } },
                function_part: { ServiceIdWithFuncName: [{ Literal: 'service' }, { Literal: 'function' }] },
                args: [
                    {
                        Number: {
                            Int: 1,
                        },
                    },
                    {
                        Number: {
                            Int: 2,
                        },
                    },
                    {
                        Number: {
                            Int: 3,
                        },
                    },
                    { Variable: 'arg' },
                ],
                output: { Scalar: 'output' },
            },
        });
    });
});
