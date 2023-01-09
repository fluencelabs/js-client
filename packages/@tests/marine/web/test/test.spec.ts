import Webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import webpackConfig from '../webpack.config.js';
import process from 'process';
import path from 'path';
import fs from 'fs';

// change directory to the location to the test-project.
// run all the subsequent Webpack scripts in that directory
process.chdir(path.join(__dirname, '..'));

let server;
const port = 8080;

jest.setTimeout(10000);

const startServer = async (modifyConfig?) => {
    const loadInBrowserToDebug = false;
    // const loadInBrowserToDebug = true; // use this line to debug

    modifyConfig = modifyConfig || ((_) => {});

    const config: any = webpackConfig();
    modifyConfig(config);
    config.devServer.open = loadInBrowserToDebug;
    server = await makeServer(config);
};

// https://stackoverflow.com/questions/42940550/wait-until-webpack-dev-server-is-ready
function makeServer(config) {
    return new Promise((resolve, reject) => {
        const compiler = Webpack(config);

        let compiled = false;
        let listening = false;

        compiler.hooks.done.tap('tap_name', () => {
            // console.log('compiled');

            if (listening) resolve(server);
            else compiled = true;
        });

        const server = new WebpackDevServer(compiler, config.devServer);

        server.listen(port, '0.0.0.0', (err) => {
            if (err) return reject(err);

            // console.log('listening');

            if (compiled) {
                resolve(server);
            } else {
                listening = true;
            }
        });
    });
}

const stopServer = async () => {
    console.log('test: stopping server');
    await server.stop();
};

const publicDir = 'public';

const copyFile = async (packageName: string, fileName: string) => {
    const modulePath = require.resolve(packageName);
    const source = path.join(path.dirname(modulePath), fileName);
    const dest = path.join(publicDir, fileName);

    return fs.promises.copyFile(source, dest);
};

const copyPublicDeps = async () => {
    await fs.promises.mkdir(publicDir, { recursive: true });
    return Promise.all([
        copyFile('@fluencelabs/marine-js', 'marine-js.wasm'),
        copyFile('@fluencelabs/avm', 'avm.wasm'),
    ]);
};

const cleanPublicDeps = () => {
    return fs.promises.rm(publicDir, { recursive: true, force: true });
};

describe('Browser integration tests', () => {
    beforeEach(async () => {
        await copyPublicDeps();
    });

    afterEach(async () => {
        await stopServer();
        await cleanPublicDeps();
    });

    it('Some test', async () => {
        console.log('test: starting server...');
        await startServer();
        console.log('test: navigating to page...');
        await page.goto('http://localhost:8080/');

        console.log('test: running script in browser...');
        const res = await page.evaluate(() => {
            // @ts-ignore
            return window.MAIN();
        });

        console.log('test: checking expectations...');
        await expect(res).toMatchObject({
            retCode: 0,
            errorMessage: '',
        });
    });
});
