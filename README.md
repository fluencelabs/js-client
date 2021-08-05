# Fluence JS SDK

[![npm](https://img.shields.io/npm/v/@fluencelabs/fluence)](https://www.npmjs.com/package/@fluencelabs/fluence)

Official SDK for building web-based applications for Fluence

## About Fluence

Fluence is an open application platform where apps can build on each other, share data and users

|         Layer         |                                                               Tech                                                                |              Scale               |               State               |                                                   Based on                                                    |
| :-------------------: | :-------------------------------------------------------------------------------------------------------------------------------: | :------------------------------: | :-------------------------------: | :-----------------------------------------------------------------------------------------------------------: |
|       Execution       |                                             [FCE](https://github.com/fluencelabs/fce)                                             |           Single peer            | Disk, network, external processes | Wasm, [IT](https://github.com/fluencelabs/interface-types), [Wasmer\*](https://github.com/fluencelabs/wasmer) |
|      Composition      |                                      [Aquamarine](https://github.com/fluencelabs/aquamarine)                                      |          Involved peers          |      Results and signatures       |                                                 ⇅, π-calculus                                                 |
|       Topology        | [TrustGraph](https://github.com/fluencelabs/fluence/tree/master/trust-graph), [DHT\*](https://github.com/fluencelabs/rust-libp2p) | Distributed with Kademlia\* algo |    Actual state of the network    |                                [libp2p](https://github.com/libp2p/rust-libp2p)                                |
| Security & Accounting |                                                            Blockchain                                                             |          Whole network           |        Licenses & payments        |                                                  substrate?                                                   |

<img alt="aquamarine scheme" align="center" src="doc/stack.png"/>

## Installation

With npm

```bash
npm install @fluencelabs/fluence
```

With yarn

```bash
yarn add @fluencelabs/fluence
```

## Getting started

Pick a node to connect to the Fluence network. The easiest way to do so is by using [fluence-network-environment](https://github.com/fluencelabs/fluence-network-environment) package

```typescript
import { dev } from '@fluencelabs/fluence-network-environment';

export const relayNode = dev[0];
```

Initialize client

```typescript
import { createClient, FluenceClient } from '@fluencelabs/fluence';

const client = await createClient(relayNode);
```

Respond to service function calls

```typescript
subscribeToEvent(client, 'helloService', 'helloFunction', (args) => {
    const [networkInfo] = args;
    console.log(networkInfo);
});
```

Make a particle

```typescript
const particle = new Particle(
    `
    (seq
        (call myRelay ("peer" "identify") [] result)
        (call %init_peer_id% ("helloService" "helloFunction") [result])
    )`,
    {
        myRelay: client.relayPeerId,
    },
);
```

Send it to the network

```typescript
await sendParticle(client, particle);
```

Observe the result in browser console

```json
{
    "external_addresses": ["/ip4/1.2.3.4/tcp/7777", "/dns4/dev.fluence.dev/tcp/19002"]
}
```

## Documentation

Guide on building applications: [doc.fluence.dev](https://doc.fluence.dev/docs/tutorials_tutorials/building-a-frontend-with-js-sdk)

Sample applications:

-   [FluentPad](https://github.com/fluencelabs/fluent-pad): a collaborative text editor with users online status synchronization
-   [Examples](https://github.com/fluencelabs/examples): examples of using the Aqua programming language

About [Fluence](https://fluence.network/)

## Developing

### Setting up Dev

Install node packages

```bash
npm install
```

### Running tests

Tests are split into unit and integration categories. By default integration tests require a locally running Fluence node with 4310 port open for ws connections. The dependency can be started with docker

```bash
 docker run --rm -e RUST_LOG="info" -p 1210:1210 -p 4310:4310 fluencelabs/fluence:freeze -t 1210 -w 4310 -k gKdiCSUr1TFGFEgu2t8Ch1XEUsrN5A2UfBLjSZvfci9SPR3NvZpACfcpPGC3eY4zma1pk7UvYv5zb1VjvPHwCjj
```

To run all tests in interactive mode

```bash
npm run test
```

To run only unit tests

```bash
npm run test:unit
```

To run only integration tests

```bash
npm run test:unit
```

To run all tests

```bash
npm run test:all
```

## Contributing

While the project is still in the early stages of development, you are welcome to track progress and contribute. As the project is undergoing rapid changes, interested contributors should contact the team before embarking on larger pieces of work. All contributors should consult with and agree to our [basic contributing rules](CONTRIBUTING.md).

## License

[Apache 2.0](LICENSE)
