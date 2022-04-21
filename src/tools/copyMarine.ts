#! /usr/bin/env node

import fs from 'fs';
import path from 'path';

const firstArgument = process.argv[2];

if (!firstArgument) {
    console.log(`Expected exactly 1 argument, got 0. Usage: ${path.basename(process.argv[1])} <destination directory>`);
    process.exit(1);
}

let destPath = firstArgument;
if (!path.isAbsolute(destPath)) {
    destPath = path.join(process.cwd(), destPath);
}

async function copyFile(packageName: string, fileName: string) {
    const modulePath = require.resolve(packageName);
    const source = path.join(path.dirname(modulePath), fileName);
    const dest = path.join(destPath, fileName);

    console.log(`copying ${fileName}`);
    console.log('from: ', source);
    console.log('to: ', dest);
    await fs.promises.copyFile(source, dest);
}

async function main() {
    console.log('ensure directory exists: ', destPath);
    await fs.promises.mkdir(destPath, { recursive: true });

    await Promise.all([
        copyFile('@fluencelabs/marine-js', 'marine-js.web.js'),
        copyFile('@fluencelabs/marine-js', 'marine-js.wasm'),
        copyFile('@fluencelabs/avm', 'avm.wasm'),
    ]);
}

main()
    .then(() => {
        console.log('done!');
    })
    .catch((err) => {
        console.error('Something went wrong!', err);
    });
