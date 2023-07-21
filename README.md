# Fluence JS Client

[![npm](https://img.shields.io/npm/v/@fluencelabs/js-client.api?label=@fluencelabs/js-client.api)](https://www.npmjs.com/package/@fluencelabs/js-client.api)
[![npm](https://img.shields.io/npm/v/@fluencelabs/js-client.web.standalone?label=@fluencelabs/js-client.web.standalone)](https://www.npmjs.com/package/@fluencelabs/js-client.web.standalone)

This is the Javascript client for the [Fluence](https://fluence.network) network. The main role of the JS client is to connect to the Fluence Network and allow you to integrate Aqua code into your application.

## Installation

Adding the Fluence JS client for your web application is very easy.

### Browser-based Apps

1. Add a script tag with the JS Client bundle to your `index.html`. The easiest way to do this is using a CDN (like [JSDELIVR](https://www.jsdelivr.com/) or [UNPKG](https://unpkg.com/)). The script is large, thus we highly recommend to use the `async` attribute.

    Here is an example using the JSDELIVR CDN:

    ```html
    <head>
        <title>Cool App</title>
        <script
            src="https://cdn.jsdelivr.net/npm/@fluencelabs/js-client.web.standalone@0.13.3/dist/js-client.min.js"
            async
        ></script>
    </head>
    ```

    If you cannot or don't want to use a CDN, feel free to get the script directly from the [npm package](https://www.npmjs.com/package/@fluencelabs/js-client.web.standalone) and host it yourself. You can find the script in the `/dist` directory of the package. (Note: this option means that developers understand what they are doing and know how to serve this file from their own web server.)

2. Install the following packages:

    ```
    npm i @fluencelabs/js-client.api @fluencelabs/fluence-network-environment
    ```

3. Add the following lines at the beginning of your code:

    ```
    import { Fluence } from "@fluencelabs/js-client.api";
    import { randomKras } from '@fluencelabs/fluence-network-environment';

    Fluence.connect(randomKras());
    ```

### Node.js Apps

**Prerequisites:**

The Fluence JS Client only supports the ESM format. This implies that a few preliminary steps are required if your project is not already using ESM:

-   Add `"type": "module"` to your package.json.
-   Replace `"main": "index.js"` with `"exports": "./index.js"` in your package.json.
-   Remove `'use strict';` from all JavaScript files.
-   Replace all `require()`/`module.export` with `import`/`export`.
-   Use only full relative file paths for imports: `import x from '.';` → `import x from './index.js';`.

If you are using TypeScript:

-   Make sure you are using TypeScript 4.7 or later.
-   Add [`"module": "ESNext", "target": "ESNext", "moduleResolution": "nodenext"`](https://www.typescriptlang.org/tsconfig#module) to your tsconfig.json.
-   Use only full relative file paths for imports: `import x from '.';` → `import x from './index.js';`.
-   Remove `namespace` usage and use `export` instead.
-   You must use a `.js` extension in relative imports even though you're importing `.ts` files.

**Installation:**

1. Install the following packages:

    ```
    npm i @fluencelabs/js-client.api"@fluencelabs/js-client.node @fluencelabs/fluence-network-environment
    ```

2. Add the following lines at the beginning of your code:

    ```
    import '@fluencelabs/js-client.node';
    import { Fluence } from "@fluencelabs/js-client.api";
    import { randomKras } from '@fluencelabs/fluence-network-environment';

    Fluence.connect(randomKras());
    ```

## Usage in an Application

Once you've added the client, you can compile [Aqua](https://github.com/fluencelabs/aqua) and run it in your application. To compile Aqua, use [Fluence CLI](https://github.com/fluencelabs/cli).

1. Install the package:

    ```
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

    ```
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

-   `particle`: everything related to particle processing queue
-   `aqua`: infrastructure of aqua compiler support
-   `connection`: connection layer
-   `marine`: Marine JS logs

### Enabling logs in Node.js

enable logs, pass the environment variable `DEBUG` with the corresponding log level. For example:

```sh
DEBUG=fluence:* node --loader ts-node/esm ./src/index.ts
```

### Enabling logs in the browser

To enable logs, set the `localStorage.debug` variable. For example:

```
localStorage.debug = 'fluence:*'
```

**NOTE**

In Chromium-based web browsers (e.g. Brave, Chrome, and Electron), the JavaScript console will—by default—only show messages logged by debug if the "Verbose" log level is enabled.

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

All software code is copyright (c) Fluence Labs, Inc. under the [Apache-2.0](./LICENSE) license.
