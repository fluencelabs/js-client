import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";

import { makeDefaultPeer } from "@fluencelabs/js-client.web";
import { krasnodar } from "@fluencelabs/fluence-network-environment";
import { getRelayTime } from "./_aqua/demo";

const relayNode = krasnodar[2];

const peer = makeDefaultPeer();

function App() {
    const [connected, setConnected] = useState<boolean>(false);

    useEffect(() => {
        peer.start({ connectTo: relayNode })
            .then(() => {
                setConnected(true);
            })
            .catch((err) => {
                console.log("Client initialization failed", err);
                setConnected(false);
            });
    }, []);

    const handleClick = () => {
        getRelayTime(peer, relayNode.peerId).then((x) => alert(x));
    };

    const connectedStr = connected ? "Connected" : "Disconnected";

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <button onClick={handleClick}>Send ping</button>
                <p>{connectedStr}</p>
                <p>
                    Edit <code>src/App.tsx</code> and save to reload.
                </p>
                <a
                    className="App-link"
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Learn React
                </a>
            </header>
        </div>
    );
}

export default App;
