import puppeteer from 'puppeteer';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { CDN_PUBLIC_PATH, startCdn, startContentServer, stopServer } from '@test/test-utils';
import { symlink, access } from 'fs/promises';

const port = 3000;
const uri = `http://localhost:${port}/`;
const __dirname = dirname(fileURLToPath(import.meta.url));
const publicPath = join(__dirname, '../public/');

const test = async () => {
    const localServer = await startContentServer(port, publicPath);
    try {
        await access(join(publicPath, 'source'))
    } catch {
        await symlink(CDN_PUBLIC_PATH, join(publicPath, 'source'));
    }

    console.log('starting puppeteer...');
    const browser = await puppeteer.launch();
    const page = (await browser.pages())[0];

    // uncomment to debug what's happening inside the browser
    // page.on('console', (msg) => console.log('// from console: ', msg.text()));

    console.log('going to the page in browser...');
    await page.goto(uri);

    console.log('clicking button...');
    // await page.waitForTimeout(10000000);
    await page.click('#btn');

    console.log('waiting for result to appear...');
    const elem = await page.waitForSelector('#res');

    console.log('getting the content of result div...');
    const content = await elem?.evaluate((x) => x.textContent);
    console.log('raw result: ', content);

    await browser.close();
    await stopServer(localServer);

    if (!content) {
        throw new Error('smoke test failed!');
    }
};

test().then(() => console.log('smoke tests succeed!'));
