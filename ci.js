#! /usr/bin/env node

const fs = require("fs").promises;
const path = require("path");

function printUsage() {
    console.log(`Usage: "ci check-consistency" or "ci bump-version %postfix%"`);
}

let postfix;
const mod = process.argv[2];

switch (mod) {
    case "bump-version":
        postfix = process.argv[3];
        if (!postfix) {
            printUsage();
            process.exit();
        }
        break;

    case "":
    case undefined:
    case "check-consistency":
        break;

    default:
        printUsage();
        process.exit(0);
}

const pathToPackages = "./packages/";

async function getFiles(currentPath, files) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (let file of entries) {
        if (file.name === "node_modules") {
            continue;
        }

        if (file.isDirectory()) {
            await getFiles(`${currentPath}${file.name}/`, files);
        } else if (file.name === "package.json") {
            const packageJsonPath = path.join(
                __dirname,
                currentPath,
                file.name
            );
            files.push(packageJsonPath);
        }
    }
}

async function doGetFiles(path) {
    const files = [];
    await getFiles(path, files);
    return files;
}

async function getVersion(file) {
    const content = await fs.readFile(file);
    const json = JSON.parse(content);
    return [json.name, json.version];
}

function isWorkspaceDep(obj, name, version) {
    if (!obj[name]) {
        return;
    }

    return /^workspace\:/.test(obj[name]);
}

async function getVersionsMap(allPackageJsons) {
    const map = new Map();
    for (let file of allPackageJsons) {
        console.log("Reading version from: ", file);
        const [name, version] = await getVersion(file);
        map.set(name, version);
    }
    return map;
}

async function checkConsistency(packageJsons, versionsMap) {}

async function bumpVersions(file, versionsMap) {
    console.log("Updating: ", file);
    let content = await fs.readFile(file);
    const json = JSON.parse(content);
    const version = versionsMap.get(json.name);
    if (!version) {
        console.log("Failed to get version for package: ", file);
        process.exit(1);
    }
    const newVersion = `workspace:${version}${postfix}`;

    for (const [name, version] of versionsMap) {
        if (isWorkspaceDep(json.dependencies, name, version)) {
            json.dependencies[name] = newVersion;
        }
        if (isWorkspaceDep(json.devDependencies, name, version)) {
            json.devDependencies[name] = newVersion;
        }
    }

    content = JSON.stringify(json, undefined, 4);
    await fs.writeFile(file, content);
}

async function processPackageJsons(allPackageJsons, versionsMap, fn) {
    for (let file of allPackageJsons) {
        await fn(file, versionsMap);
    }
}

async function run() {
    const packageJsons = await doGetFiles(pathToPackages);
    const versionsMap = await getVersionsMap(packageJsons);

    // always check versions consistency
    console.log("Checking versions consistency...");
    processPackageJsons(packageJsons, versionsMap, checkConsistency);
    console.log("Versions are consistent");

    if (mod === "bump-version") {
        console.log("Adding postfix: ", postfix);
        processPackageJsons(packageJsons, versionsMap, bumpVersions);
        console.log("Done");
    }
}

run();
