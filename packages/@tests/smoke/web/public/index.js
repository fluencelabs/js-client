const fluence = globalThis.fluence;

const relay = {
    multiaddr: '/ip4/127.0.0.1/tcp/4310/ws/p2p/12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
    peerId: '12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
};

const getRelayTime = (relayPeerId) => {
    const script = `
                    (xor
                     (seq
                      (seq
                       (seq
                        (seq
                         (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
                         (call %init_peer_id% ("getDataSrv" "relayPeerId") [] relayPeerId)
                        )
                        (call -relay- ("op" "noop") [])
                       )
                       (xor
                        (seq
                         (call relayPeerId ("peer" "timestamp_ms") [] ts)
                         (call -relay- ("op" "noop") [])
                        )
                        (seq
                         (call -relay- ("op" "noop") [])
                         (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 1])
                        )
                       )
                      )
                      (xor
                       (call %init_peer_id% ("callbackSrv" "response") [ts])
                       (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 2])
                      )
                     )
                     (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 3])
                    )
    `;

    const def = {
        functionName: 'getRelayTime',
        arrow: {
            tag: 'arrow',
            domain: {
                tag: 'labeledProduct',
                fields: {
                    relayPeerId: {
                        tag: 'scalar',
                        name: 'string',
                    },
                },
            },
            codomain: {
                tag: 'unlabeledProduct',defaultClient
                items: [
                    {
                        tag: 'scalar',
                        name: 'u64',
                    },
                ],
            },
        },
        names: {
            relay: '-relay-',
            getDataSrv: 'getDataSrv',
            callbackSrv: 'callbackSrv',
            responseSrv: 'callbackSrv',
            responseFnName: 'response',
            errorHandlingSrv: 'errorHandlingSrv',
            errorFnName: 'error',
        },
    };

    const config = {};

    const args = {};
    return fluence.callFunction({
        args,
        def,
        config,
        script,
    });
};

window.main = async () => {
    console.log('starting fluence...');
    await fluence.defaultClient.connect(relay);
    console.log('started fluence');

    console.log('getting relay time...');
    const relayTime = await getRelayTime(relay.peerId);
    console.log('got relay time, ', res);

    console.log('stopping fluence...');
    await fluence.defaultClient.stop();
    console.log('stopped fluence...');

    return relayTime;
};
