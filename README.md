# Fluence JS Client

[![npm](https://img.shields.io/npm/v/@fluencelabs/js-client.api)](https://www.npmjs.com/package/@fluencelabs/js-client.api)
[![npm](https://img.shields.io/npm/v/@fluencelabs/js-client.web.standalone)](https://www.npmjs.com/package/@fluencelabs/js-client.web.standalone)

Javascript client to Fluence network

## WARNING

Client for NodeJS is broken. We will fix that shortly.

## Getting started

Adding JS Client for your web application is very easy

1. Pick you favorite framework
2. Add a script tag with the JS Client bundle to your index.html. The easiest way to do so is using CDN (like https://www.jsdelivr.com/ or https://unpkg.com/) The script is large thus we highly recommend to use `async` attribute

Here is an example using React App and jsdelivr cdn.

```
  <title>React App</title>
  <script src='https://cdn.jsdelivr.net/npm/@fluencelabs/js-client.web.standalone@0.10.0/dist/js-client.min.js'
    async></script>
</head>
```

If you can't or don't want to use CDN, feel free to get the script directly from the npm package and host in yourself: `https://www.npmjs.com/package/@fluencelabs/js-client.web.standalone`. You can find the script in `/dist` directory of the package. (note: that options means that the developer understands what he's doing and he knows to serve this file from his own web server)

3. Install the following packages:

```
npm i @fluencelabs/js-client.api @fluencelabs/fluence-network-environment
```

4. In the beginning of your app do the following:

```
import { Fluence } from "@fluencelabs/js-client.api";
import { krasnodar } from "@fluencelabs/fluence-network-environment";

Fluence.start({
  relay: krasnodar[3],
});
```

## Use aqua in web application

Once you've added the client you can compile aqua and run it in your application.

TBD

## Developing

To hack on the JS Client itself refer to [dev page](./DEVLOPING.md).

## Support

Please, file an [issue](https://github.com/fluencelabs/fluence-js/issues) if you find a bug. You can also contact us at [Discord](https://discord.com/invite/5qSnPZKh7u) or [Telegram](https://t.me/fluence_project). We will do our best to resolve the issue ASAP.

## Contributing

Any interested person is welcome to contribute to the project. Please, make sure you read and follow some basic [rules](./CONTRIBUTING.md).

## License

All software code is copyright (c) Fluence Labs, Inc. under the [Apache-2.0](./LICENSE) license.
