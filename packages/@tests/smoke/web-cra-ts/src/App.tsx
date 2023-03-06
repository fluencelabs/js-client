import { runTest } from '@test/aqua_for_test';
import React from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
    const [result, setResult] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const onButtonClick = () => {
        runTest()
            .then((res) => {
                if (res.errors.length === 0) {
                    setResult(JSON.stringify(res));
                    setError(null);
                } else {
                    setResult(null);
                    setError(res.errors.toString());
                }
            })
            .catch((err) => {
                setResult('');
                setError(err.toString());
            });
    };

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>
                    Edit <code>src/App.tsx</code> and save to reload.
                </p>
                <button id="btn" onClick={onButtonClick}>
                    Click to run test
                </button>

                {result && <div id="res">{result}</div>}
                {error && <div id="error">{error}</div>}
                <a className="App-link" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
                    Learn React
                </a>
            </header>
        </div>
    );
}

export default App;
