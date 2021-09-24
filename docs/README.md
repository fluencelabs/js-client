@fluencelabs/fluence / [Exports](modules.md)

# Fluence JS

To start developing applications with Fluence JS refer to the official [gitbook page](https://doc.fluence.dev/docs/js-sdk)

Fluence JS is the implementation of a Fluence protocol for JS-based environments. It can be used to connect browsers, Node.js applications and so on to the Fluence p2p network.

Similar to reference node implementation it provides:

- Peer-to-peer communication layer
- Marine interpreter
- Aqua VM
- Builtin services

Unlike reference implementation Fluence JS does not allow to run Marine services. Instead it can expose APIs directly from Typescript and Javascript by taking advantage of functions generated with Aqua compiler.

Fluence JS can be used with any framework of your choice \(or even without frameworks\).
