import puppeteer from 'puppeteer';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { startCdn, startContentServer, stopServer } from '@test/test-utils';

const port = 3000;
const uri = `http://localhost:${port}/`;
const __dirname = dirname(fileURLToPath(import.meta.url));
const publicPath = join(__dirname, '../public/');

const test = async () => {
    const cdn = startCdn();
    const localServer = startContentServer(port, publicPath);

    console.log('starting puppeteer...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    console.log('going to the page in browser...');
    await page.goto(uri);

    console.log('Running smoke test function...');
    // const result = await page.evaluate('window.main()');
    const result = await page.evaluate('globalThis.main()');

    console.log('received result: ', result);

    await browser.close();
    // stopServer(cdn);
    // stopServer(localServer);

    if (!result) {
        throw new Error('Smoke test failed!');
    }
};

test()
    .then(() => console.log('done!'))
    .catch((err) => console.error('error: ', err));
