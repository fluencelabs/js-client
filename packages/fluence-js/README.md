# Fluence JS

[![npm](https://img.shields.io/npm/v/@fluencelabs/fluence)](https://www.npmjs.com/package/@fluencelabs/fluence)

Official TypeScript implementation of the Fluence Peer.

## Getting started

To start developing applications with Fluence JS refer to the official [documentation](https://doc.fluence.dev/docs/js-sdk)

## Contributing

While the project is still in the early stages of development, you are welcome to track progress and contribute. As the project is undergoing rapid changes, interested contributors should contact the team before embarking on larger pieces of work. All contributors should consult with and agree to our [basic contributing rules](CONTRIBUTING.md).

### Setting up dev environment

Install node packages

```bash
npm install
```

### Running tests

Tests are split into unit and integration categories. By default integration tests require a locally running Fluence node with 4310 port open for ws connections. The dependency can be started with docker

```bash
 docker run --rm -e RUST_LOG="info" -p 1210:1210 -p 4310:4310 fluencelabs/fluence -t 1210 -w 4310 -k gKdiCSUr1TFGFEgu2t8Ch1XEUsrN5A2UfBLjSZvfci9SPR3NvZpACfcpPGC3eY4zma1pk7UvYv5zb1VjvPHwCjj
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

## License

[Apache 2.0](LICENSE)
