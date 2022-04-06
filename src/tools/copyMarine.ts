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

console.log('ensure directory exists: ', destPath);
fs.mkdirSync(destPath, { recursive: true });

function copyFile(packageName: string, fileName: string) {
    const modulePath = require.resolve(packageName);
    const source = path.join(path.dirname(modulePath), fileName);
    const dest = path.join(destPath, fileName);

    console.log(`copying ${fileName}`);
    console.log('from: ', source);
    console.log('to: ', dest);
    fs.copyFileSync(source, dest);
}

copyFile('@fluencelabs/marine-js', 'marine-js.web.js');
copyFile('@fluencelabs/marine-js', 'marine-js.wasm');
copyFile('@fluencelabs/avm', 'avm.wasm');

console.log('done!');
