import { Fluence, callAquaFunction } from "./js-client.min.js";

const relay = {
  multiaddr:
    "/ip4/127.0.0.1/tcp/999/ws/p2p/12D3KooWBbMuqJJZT7FTFN4fWg3k3ipUKx6KEy7pDy8mdorK5g5o",
  peerId: "12D3KooWBbMuqJJZT7FTFN4fWg3k3ipUKx6KEy7pDy8mdorK5g5o",
};

const getRelayTime = () => {
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
                    )`;

  const def = {
    functionName: "getRelayTime",
    arrow: {
      tag: "arrow",
      domain: {
        tag: "labeledProduct",
        fields: {
          relayPeerId: {
            tag: "scalar",
            name: "string",
          },
        },
      },
      codomain: {
        tag: "unlabeledProduct",
        items: [
          {
            tag: "scalar",
            name: "u64",
          },
        ],
      },
    },
    names: {
      relay: "-relay-",
      getDataSrv: "getDataSrv",
      callbackSrv: "callbackSrv",
      responseSrv: "callbackSrv",
      responseFnName: "response",
      errorHandlingSrv: "errorHandlingSrv",
      errorFnName: "error",
    },
  };

  const config = {};

  const args = { relayPeerId: relay.peerId };

  return callAquaFunction({
    args,
    script,
    config,
    peer: Fluence.defaultClient,
    fireAndForget: false
  });
};

const main = async () => {
  console.log("starting fluence...");
  await Fluence.connect(relay, {
    CDNUrl: "http://localhost:3000",
  });
  console.log("started fluence");

  console.log("getting relay time...");
  const relayTime = await getRelayTime();
  console.log("got relay time, ", relayTime);

  console.log("stopping fluence...");
  await Fluence.disconnect();
  console.log("stopped fluence...");

  return relayTime;
};

const btn = document.getElementById("btn");

btn.addEventListener("click", () => {
  main().then((res) => {
    const inner = document.createElement("div");
    inner.id = "res";
    inner.innerText = res;
    document.getElementById("res-placeholder").appendChild(inner);
  }).catch(err => {
    if (err instanceof Error) {
      console.log(JSON.stringify({ name: err.name, message: err.message, stack: err.stack }));
      return;
    }
    console.log(JSON.stringify(err));
  });
});
