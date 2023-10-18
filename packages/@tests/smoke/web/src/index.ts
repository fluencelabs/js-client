/**
 * Copyright 2023 Fluence Labs Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { dirname, join } from "path";
import { fileURLToPath } from "url";

import {
  CDN_PUBLIC_PATH,
  createSymlinkIfNotExists,
  JS_CLIENT_DEPS_PATH,
  startContentServer,
  stopServer,
} from "@test/test-utils";
import puppeteer from "puppeteer";

const port = 3000;
const uri = `http://localhost:${port}/`;
const __dirname = dirname(fileURLToPath(import.meta.url));
const publicPath = join(__dirname, "../public/");

const test = async () => {
  const localServer = await startContentServer(port, publicPath);

  await createSymlinkIfNotExists(CDN_PUBLIC_PATH, join(publicPath, "source"));

  await createSymlinkIfNotExists(
    JS_CLIENT_DEPS_PATH,
    join(publicPath, "node_modules"),
  );

  console.log("starting puppeteer...");
  const browser = await puppeteer.launch();
  const page = (await browser.pages())[0];

  page.on("console", (message) => {
    console.log(`${message.type().toUpperCase()}: ${message.text()}`);
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

  const content = await elem?.evaluate((x) => {
    return x.textContent;
  });

  console.log("raw result: ", content);

  await browser.close();
  await stopServer(localServer);

  if (content == null) {
    throw new Error("smoke test failed!");
  }
};

void test().then(() => {
  console.log("smoke tests succeed!");
});
