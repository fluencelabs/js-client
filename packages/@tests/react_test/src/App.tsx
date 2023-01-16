import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";

import { makeDefaultPeer } from "@fluencelabs/js-client.web";
import { krasnodar } from "@fluencelabs/fluence-network-environment";

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

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>Connected: ${connected}</p>
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
