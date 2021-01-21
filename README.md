# Fluence JS SDK

[![npm](https://img.shields.io/npm/v/@fluencelabs/fluence)](https://www.npmjs.com/package/@fluencelabs/fluence)

Official SDK for building web-based applications for [Fluence network](https://fluence.network/) 

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

Initialize client

```typescript
const relayNode = '/dns4/stage.fluence.dev/tcp/19001/wss/p2p/12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9';

let clinet: FluenceClient;

createClient(relayNode);
	.then((c) => {
		client = c;
    })
	.catch((err) => console.log('Client initialization failed', err));
```

Make a particle

```typescript
const particle = new Particle(`
    (seq
        (call myRelay ("op" "identity") [])
        (call userlistNode (userlist "join") [user])
    )`,
    {
        myRelay: client.relayPeerId,
        myPeerId: client.selfPeerId,
        user: {
            name: 'john',
            peer_id: client.selfPeerId,
            relay_id: client.relayPeerId,
        },
        userlist: '03edcc81-7777-4234-b048-36305d8d65e2',
        userlistNode: '12D3KooWEXNUbCXooUwHrHBbrmjsrpHXoEphPwbjQXEGyzbqKnE9',
    },
);
```

Send it to the network

```typescript
await sendParticle(client, particle);
```

Respond service function calls

```typescript
subscribeToEvent(client, 'helloService', 'helloWorld', (args) => {
    const [message] = args as [string];
    console.log(message);
});
```

## Documentation

Detailed guide:  [readme.io](https://fluence-labs.readme.io/docs/build-an-app)

Sample applications:

* [FluentPad](https://github.com/fluencelabs/fluent-pad): a collaborative text editor with users online status synchronization
* [Other demos](https://github.com/fluencelabs/aqua-demo): (Chat app,  Social feed app, Blog platform app)

Further documentation on Fluence: [readme.io](https://fluence-labs.readme.io/docs)

## API

### createClient

TBD

### sendParticle

TBD

### sendParticleAsFetch

TBD

### registerServiceFunction

TBD

### unregisterServiceFunction

TBD

### subscribeToEvent

TBD

### FluenceClient

TBD

### Particle

TBD

## Developing

### Setting up Dev

Install node packages

```bash
npm install
```

### Running tests

To run test execute

```bash
npm test
```

## Contributing

While the project is a still in the early stage of development, you are welcome to track progress and contribute. At the current moment we don't have detailed instructions on how to join development or which code guidelines to follow. However, you can expect more info to appear soon enough. In the meanwhile, check out the [basic contributing rules](https://github.com/fluencelabs/fluence/blob/trustless_computing/CONTRIBUTING.md).

## License

[Apache 2.0](https://github.com/fluencelabs/fluence/blob/trustless_computing/LICENSE.md)