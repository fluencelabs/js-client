# Fluence JS

To start developing applications with Fluence JS refer to the official [documentation](https://fluence.dev/docs/build/fluence-js/)

Fluence JS is an implementation of the Fluence protocol for JavaScript-based environments. It can connect browsers, Node.js applications, and so on to the Fluence p2p network.

Similar to the [Rust Fluence Peer implementation](https://github.com/fluencelabs/fluence) it includes:

-   Peer-to-peer communication layer (via [js-libp2p](https://github.com/libp2p/js-libp2p))
-   [Aqua VM](https://github.com/fluencelabs/aquavm)
-   Builtin services

Fluence JS can call services and functions on the Fluence network, and expose new APIs to the p2p network directly from TypeScript and JavaScript.
[Aqua language](https://github.com/fluencelabs/aqua) uses Fluence JS as a compilation target, and they are designed to [work in tandem](https://fluence.dev/docs/build/fluence-js/in-depth#understanding-the-aqua-compiler-output).

Fluence JS can be used with any framework of your choice \(or even without frameworks\).
