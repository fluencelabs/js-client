import puppeteer from 'puppeteer';
import path from 'path';

import { startCdn, startContentServer, stopCdn } from '@test/test-utils';

const port = 3000;
const uri = `http://localhost:${port}/`;
const publicPath = path.join(__dirname, '../public/');

const test = async () => {
    const cdn = startCdn();
    const localServer = startContentServer(port, publicPath);

    console.log('starting puppeteer...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    console.log('going to the page in browser...');
    await page.goto(uri);

    console.log('Running smoke test function...');
    const result = await page.evaluate(() => {
        // @ts-ignore
        return window.main();
    });

    cdn.close();
    localServer.close();

    if (!result) {
        throw new Error('Smoke test failed!');
    }
};

test()
    .then(() => console.log('done!'))
    .catch((err) => console.error('error: ', err));
