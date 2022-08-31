import React, { useEffect, useState } from "react";
import { Fluence } from "@fluencelabs/fluence";
import { krasnodar } from "@fluencelabs/fluence-network-environment";
import logo from "./logo.svg";
import "./App.css";

function App() {
    const [connected, setConnected] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const relay = krasnodar[3];
    useEffect(() => {
        Fluence.start({
            connectTo: relay,
        })
            .then(() => {
                setConnected(true);
            })
            .catch((e) => {
                setError(e.toString());
            });
    });

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>connected: ${connected}</p>
                <p>error: ${error}</p>
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
