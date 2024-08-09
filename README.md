# Fluence JS Client

[![js-client @ npm](https://img.shields.io/npm/v/@fluencelabs/js-client?label=@fluencelabs/js-client)](https://www.npmjs.com/package/@fluencelabs/js-client)

This is the Javascript client for the [Fluence](https://fluence.network) network. The main role of the JS client is to connect to the Fluence Network and allow you to integrate Aqua code into your application.

## Installation

> JS Client only supports the ESM format that means not every Node.js project can install it.
> You can read more [here](https://nodejs.org/api/esm.html)

1. Install the client:

   ```bash
   npm i @fluencelabs/js-client
   ```

2. Add the following lines at the beginning of your code:

   ```javascript
   import { Fluence, randomKras } from "@fluencelabs/js-client";

   Fluence.connect(randomKras());
   ```

### HTML page

Add a script tag with the JS Client module to your `index.html`. The easiest way to do this is using a CDN (
like [JSDELIVR](https://www.jsdelivr.com/) or [UNPKG](https://unpkg.com/)).

Here is an example using the JSDELIVR CDN:

```html
<head>
  <title>Cool App</title>
  <script type="module">
    import {
      Fluence,
      randomKras,
    } from "https://cdn.jsdelivr.net/npm/@fluencelabs/js-client/dist/browser/index.min.js";

    Fluence.connect(randomKras());
  </script>
</head>
```

If you cannot or don't want to use a CDN, feel free to get the script directly from
the [npm package](https://www.npmjs.com/package/@fluencelabs/js-client) and host it yourself. You can find the script in
the `/dist/browser` directory of the package. (Note: this option means that developers understand what they are doing and know
how to serve this file from their own web server.)

## Usage in an Application

Once you've added the client, you can compile [Aqua](https://github.com/fluencelabs/aqua) and run it in your application. To compile Aqua, use [Fluence CLI](https://github.com/fluencelabs/cli).

1. Install the package:

   ```bash
   npm i -D @fluencelabs/cli
   ```

2. Add a directory in your project for Aqua code, e.g., `_aqua`.

3. Put `*.aqua` files in that directory.

4. Add a directory for compiled Aqua files inside your sources. For example, if your app source is located in the `src` directory, you can create `src/_aqua`.

5. To compile Aqua code once, run `npx fluence aqua -i ./_aqua -o ./src/_aqua/`. To watch the changes and to recompile on the fly, add the `-w` flag: `npx fluence aqua -w -i ./_aqua -o ./src/_aqua/`.

   **Hint**: it might be a good idea to add these scripts to your `package.json` file.
   For example, you project structure could look like this:

   ```
    ┣ _aqua
    ┃ ┗ demo.aqua
    ┣ src
    ┃ ┣ _aqua
    ┃ ┃ ┗ demo.ts
    ┃ ┗ index.ts
    ┣ package-lock.json
    ┣ package.json
    ┗ tsconfig.json
   ```

   Then, your `package.json` file should include the following lines:

   ```
   {
     ...
     "scripts": {
       ...
       "aqua:compile": "fluence aqua -i ./aqua/ -o ./src/_aqua",
       "aqua:watch": "fluence aqua -w -i ./aqua/ -o ./src/_aqua"
     },
     ...
   }
   ```

6. Now you can import and call Aqua code from your application like
   this:

   ```javascript
   import { getRelayTime } from "./_aqua/demo";

   async function buttonClick() {
     const time = await getRelayTime();
     alert("relay time: " + time);
   }
   ```

## Debug

JS Client uses the [debug](https://github.com/debug-js/debug) library under the hood for logging. The log namespaces are structured on a per-component basis, following this structure:

```
fluence:<component>:trace
fluence:<component>:debug
fluence:<component>:error
```

Marine JS logs have a slightly different structure:

```
fluence:marine:<service id>:trace
fluence:marine:<service id>:debug
fluence:marine:<service id>:info
fluence:marine:<service id>:warn
fluence:marine:<service id>:error
```

Each level corresponds to a logging level in Marine JS.

Star (`*`) character can be used as a wildcard to enable logs for multiple components at once. For example, `DEBUG=fluence:*` will enable logs for all components. To exclude a component, use a minus sign before the component name. For example, `DEBUG=fluence:*,-fluence:particle:*`

### Index of components:

- `particle`: everything related to particle processing queue
- `aqua`: infrastructure of aqua compiler support
- `connection`: connection layer
- `marine`: Marine JS logs

### Enabling logs in Node.js

Enable logs by passing the environment variable `DEBUG` with the corresponding log level. For example:

```sh
DEBUG=fluence:* node --loader ts-node/esm ./src/index.ts
```

### Enabling logs in the browser

To enable logs, set the `localStorage.debug` variable. For example:

```javascript
localStorage.debug = "fluence:*";
```

**NOTE**

In Chromium-based web browsers (e.g. Brave, Chrome, and Electron), the JavaScript console will be default—only to show
messages logged by debug if the "Verbose" log level is enabled.

## Low level usage

JS client also has an API for low level interaction with AVM and Marine JS.
It could be handy in advanced scenarios when a user fetches AIR dynamically or generates AIR without default Aqua compiler.

`callAquaFunction` Allows to call aqua function without schema.

`registerService` Gives an ability to register service without schema. Passed `service` could be

- Plain object. In this case all function properties will be registered as AIR service functions.
- Class instance. All class methods without inherited ones will be registered as AIR service functions.

## Development

To hack on the Fluence JS Client itself, please refer to the [development page](./DEVELOPING.md).

## Documentation

The starting point for all documentation related to Fluence is
[fluence.dev](https://fluence.dev/). We also have an active [YouTube channel](https://www.youtube.com/@fluencelabs).

## Support

Please, file an [issue](https://github.com/fluencelabs/js-client/issues) if you find a bug. You can also contact us at [Discord](https://discord.com/invite/5qSnPZKh7u) or [Telegram](https://t.me/fluence_project). We will do our best to resolve the issue ASAP.

## Contributing

Any interested person is welcome to contribute to the project. Please, make sure you read and follow some basic [rules](./CONTRIBUTING.md).

## License

All software code is copyright (c) Fluence DAO, Inc. under the [Apache-2.0](./LICENSE) license.
