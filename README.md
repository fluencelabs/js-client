# Fluence JS

[![npm](https://img.shields.io/npm/v/@fluencelabs/fluence)](https://www.npmjs.com/package/@fluencelabs/fluence)

Official TypeScript implementation of the Fluence Peer.

## Getting started

To start developing applications with Fluence JS refer to the official [documentation](https://fluence.dev/docs/build/fluence-js/)

## Contributing

While the project is still in the early stages of development, you are welcome to track progress and contribute. As the project is undergoing rapid changes, interested contributors should contact the team before embarking on larger pieces of work. All contributors should consult with and agree to our [basic contributing rules](CONTRIBUTING.md).

### Setting up dev environment

Fluence JS uses pnpm to manage monorepo packages. See [pnpm.io](https://pnpm.io/installation) for installation instructions.

Install dependencies

```bash
pnpm install
```

Build all packages

```
pnpm -r build
```

### Repository structure

| Folder                      | Package                 | Description                                   |
| --------------------------- | ----------------------- | --------------------------------------------- |
| packages/fluence-js         | @fluencelabs/fluence-js | TypeScript implementation of the Fluence Peer |
| packages/fluence-interfaces | @fluencelabs/interfaces | Common interfaces used in Fluence Peer        |
| packages/fluence-connection | @fluencelabs/connection | Connectivity layer used in Fluence Peer       |
| packages/fluence-keypair    | @fluencelabs/keypair    | Key Pair implementation                       |

### Running tests

Tests are split into unit and integration categories. By default integration tests require a locally running Fluence node with 4310 port open for ws connections. The dependency can be started with docker

```bash
 docker run --rm -e RUST_LOG="info" -p 1210:1210 -p 4310:4310 fluencelabs/fluence -t 1210 -w 4310 -k gKdiCSUr1TFGFEgu2t8Ch1XEUsrN5A2UfBLjSZvfci9SPR3NvZpACfcpPGC3eY4zma1pk7UvYv5zb1VjvPHwCjj
```

To run all tests

```bash
pnpm -r test
```

To run only unit tests

```bash
pnpm -r test:unit
```

To run only integration tests

```bash
pnpm -r test:integration
```

## License

[Apache 2.0](LICENSE)
