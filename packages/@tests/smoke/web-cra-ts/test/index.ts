import puppeteer from "puppeteer";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import {
  CDN_PUBLIC_PATH,
  createSymlinkIfNotExists,
  JS_CLIENT_DEPS_PATH,
  startContentServer,
  stopServer,
} from "@test/test-utils";

const port = 3001;
const uri = `http://localhost:${port}/`;
const __dirname = dirname(fileURLToPath(import.meta.url));
const publicPath = join(__dirname, "../build/");

const test = async () => {
  const localServer = await startContentServer(port, publicPath);

  await createSymlinkIfNotExists(
    JS_CLIENT_DEPS_PATH,
    join(publicPath, "node_modules"),
  );

  console.log("starting puppeteer...");
  const browser = await puppeteer.launch();
  const page = (await browser.pages())[0];
  page.on("console", (message) =>
    console.log(`${message.type().toUpperCase()}: ${message.text()}`),
  );

  page.on("request", (request) => {
    console.log(`INFO: ${request.url()} ${request.method()}`);
  });

  page.on("requestfailed", (request) => {
    console.log(`ERROR: ${request.url()} ${request.failure()?.errorText}`);
  });

  console.log("going to the page in browser...");
  await page.goto(uri);

  console.log("clicking button...");
  await page.click("#btn");

  console.log("waiting for result to appear...");
  const elem = await page.waitForSelector("#res");

  console.log("getting the content of result div...");
  const content = await elem?.evaluate((x) => x.textContent);
  console.log("raw result: ", content);

  await browser.close();
  await stopServer(localServer);

  if (!content) {
    throw new Error("smoke test failed!");
  }
};

test().then(() => console.log("smoke tests succeed!"));
