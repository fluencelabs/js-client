import { Multiaddr } from 'multiaddr';
import { nodes } from '../connection';
import { Fluence, FluencePeer, setLogLevel } from '../../index';
import { checkConnection, doNothing, handleTimeout } from '../../internal/utils';
import { Particle } from '../../internal/Particle';
import { registerHandlersHelper } from '../util';

import { testNet } from "@fluencelabs/fluence-network-environment";

const anotherPeer = new FluencePeer();

async function main() {
    // arrange
    const peer = new FluencePeer();
    await peer.start({ connectTo: testNet[0], avmLogLevel: "trace" });

    const promise = new Promise((resolve, reject) => {
        const script = `
            (xor
             (seq
              (seq
               (call %init_peer_id% ("getDataSrv" "-relay-") [] -relay-)
               (call %init_peer_id% ("getDataSrv" "clientId") [] clientId)
              )
              (xor
               (par
                (seq
                 (call -relay- ("kad" "neighborhood") [clientId [] []] neighbors)
                 (call %init_peer_id% ("op" "noop") [])
                )
                (fold neighbors n
                 (par
                  (seq
                   (call -relay- ("op" "noop") [])
                   (xor
                    (seq
                     (seq
                      (call n ("kad" "neighborhood") [n [] []] neighbors2)
                      (par
                       (seq
                        (call -relay- ("op" "noop") [])
                        (xor
                         (call %init_peer_id% ("callbackSrv" "logNeighs") [neighbors2])
                         (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 1])
                        )
                       )
                       (null)
                      )
                     )
                     (fold neighbors2 n2
                      (seq
                       (seq
                        (seq
                         (call -relay- ("op" "noop") [])
                         (xor
                          (seq
                           (seq
                            (seq
                             (seq
                              (seq
                               (call n2 ("peer" "identify") [] ident)
                               (call n2 ("dist" "list_blueprints") [] blueprints)
                              )
                              (call n2 ("dist" "list_modules") [] modules)
                             )
                             (call n2 ("srv" "list") [] services)
                            )
                            (call -relay- ("op" "noop") [])
                           )
                           (xor
                            (call %init_peer_id% ("callbackSrv" "collectPeerInfo") [n2 ident services blueprints modules])
                            (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 2])
                           )
                          )
                          (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 3])
                         )
                        )
                        (call -relay- ("op" "noop") [])
                       )
                       (next n2)
                      )
                     )
                    )
                    (seq
                     (call -relay- ("op" "noop") [])
                     (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 4])
                    )
                   )
                  )
                  (next n)
                 )
                )
               )
               (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 5])
              )
             )
             (call %init_peer_id% ("errorHandlingSrv" "error") [%last_error% 6])
            )
        `;
        const particle = Particle.createNew(script);

        let outer = ["1"];
        let returns = 0;
        registerHandlersHelper(peer, particle, {
            getDataSrv: {
                "-relay-": _ => {
                    return peer.getStatus().relayPeerId;
                },
                "clientId": _ => {
                    return peer.getStatus().peerId;
                },
                "outer": _ => {
                    return outer;
                }
            },
            op: {
                return: (args) => {
                    console.log("got op return: ", JSON.stringify(args));
                    returns += 1;
                    // if (returns == 5) {
                    //     resolve(undefined);
                    // }
                }
            },
            "callbackSrv": {
                "logNeighs": args => {}
            },
        });

        peer.internals.initiateParticle(particle, handleTimeout(reject));
    });

    await promise;

    await peer.stop();
}

main()
