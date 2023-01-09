import "@fluencelabs/js-client.node";
import { Fluence } from "@fluencelabs/fluence";

const peer = Fluence.getPeer();

const main = async () => {
    await peer.start({});
    const peerId = peer.getStatus().peerId;
    if (!peerId) {
        throw new Error("Peer id is null");
    }
    console.log("peer id is: ", peerId);
    await peer.stop();
};

main()
    .then(() => console.log("done"))
    .catch((err) => console.error(err))
    .finally(() => {
        if (peer) {
            peer.stop();
        }
    });
