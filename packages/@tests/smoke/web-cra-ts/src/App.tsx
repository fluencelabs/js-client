import { runTest, TestResult } from "@test/aqua_for_test";
import React from "react";
import logo from "./logo.svg";
import "./App.css";

function App() {
  const [result, setResult] = React.useState<TestResult | null>(null);

  const onButtonClick = () => {
    runTest()
      .then((res) => {
        setResult(res);
      })
      .catch((err) => {
        if (err instanceof Error) {
          console.log(
            JSON.stringify({
              name: err.name,
              message: err.message,
              stack: err.stack,
            }),
          );
        } else {
          console.log(JSON.stringify(err));
        }

        setResult({ type: "failure", error: err.toString() });
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

        {result && result.type === "success" && (
          <div id="res">{result.data}</div>
        )}
        {result && result.type === "failure" && (
          <div id="error">{result.error}</div>
        )}
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
