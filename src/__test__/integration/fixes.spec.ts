import { createClient, FluenceClient } from '../../FluenceClient';
import { RequestFlowBuilder } from '../../internal/RequestFlowBuilder';

async function getPeerExternalAddresses(client: FluenceClient): Promise<string[]> {
    let request;
    const promise = new Promise<string[]>((resolve, reject) => {
        request = new RequestFlowBuilder()
            .withRawScript(
                `
(seq
 (seq
  (call %init_peer_id% ("getDataSrv" "relay") [] relay)
  (call %init_peer_id% ("peer" "identify") [] res)
 )
 (call %init_peer_id% ("callbackSrv" "response") [res.$.external_addresses!])
)

            `,
            )
            .configHandler((h) => {
                h.on('getDataSrv', 'relay', () => {
                    return client.relayPeerId;
                });
                h.on('getRelayService', 'hasReleay', () => {
                    // Not Used
                    return client.relayPeerId !== undefined;
                });

                h.on('callbackSrv', 'response', (args) => {
                    const [res] = args;
                    resolve(res);
                });

                h.on('nameOfServiceWhereToSendXorError', 'errorProbably', (args) => {
                    // assuming error is the single argument
                    const [err] = args;
                    reject(err);
                });
            })
            .handleScriptError(reject)
            .handleTimeout(() => {
                reject('Request timed out');
            })
            .build();
    });
    await client.initiateFlow(request);
    return promise;
}

let client: FluenceClient;

describe('Tests cases for different fixes', () => {
    afterEach(async () => {
        if (client) {
            await client.disconnect();
        }
    });

    it('Should throw correct message when calling non existing local service', async function () {
        // arrange
        client = await createClient();

        // act
        const res = getPeerExternalAddresses(client);

        // assert
        await expect(res).rejects.toMatch(
            "The handler did not set any result. Make sure you are calling the right peer and the handler has been registered. Original request data was: serviceId='peer' fnName='identify' args=''",
        );
    });
});
