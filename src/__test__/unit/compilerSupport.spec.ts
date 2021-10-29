import { callFunction } from '../../internal/compilerSupport/v2';

const names = {
    relay: '-relay-',
    getDataSrv: 'getDataSrv',
    callbackSrv: 'callbackSrv',
    responseSrv: 'callbackSrv',
    responseFnName: 'response',
    errorHandlingSrv: 'errorHandlingSrv',
    errorFnName: 'error',
};

const dontCareScript = '(null)';

// argDefs: [
//     {
//         name: 'callback',
//         argType: {
//             tag: 'callback',
//             callback: {
//                 argDefs: [
//                     {
//                         name: 'arg0',
//                         argType: {
//                             tag: 'primitive',
//                         },
//                     },
//                     {
//                         name: 'arg1',
//                         argType: {
//                             tag: 'primitive',
//                         },
//                     },
//                 ],
//                 returnType: {
//                     tag: 'void',
//                 },
//             },
//         },
//     },
// ],

describe('Compiler support tests', () => {
    it('config should work', async () => {
        await callFunction(
            [1],
            {
                functionName: 'dontcare',
                returnType: { tag: 'void' },
                argDefs: [
                    {
                        name: 'arg0',
                        argType: {
                            tag: 'primitive',
                        },
                    },
                ],
                names: names,
            },
            dontCareScript,
        );
    });
});
