# Setting up dev environment

JS Client uses pnpm to manage monorepo packages. See [pnpm.io](https://pnpm.io/installation) for installation instructions.

Install dependencies

```bash
pnpm install
```

Build all packages

```
pnpm -r build
```

# Running tests

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

# Repo structure:

TBD

# Architecture

TBD
