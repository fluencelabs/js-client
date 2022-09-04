#! /usr/bin/env node

const fs = require("fs").promises;
const path = require("path");

function printUsage() {
    console.log(`Usage: "ci check-consistency" or "ci bump-version %postfix%"`);
}

let postfix;
const mode = process.argv[2];

switch (mode) {
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

function processDep(obj, name, fn) {
    if (!obj) {
        return;
    }

    if (!obj[name]) {
        return;
    }

    if (!/^workspace\:/.test(obj[name])) {
        return;
    }

    const version = obj[name].replace("workspace:", "");
    fn(obj, version);
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

function getVersionForPackageOrThrow(versionsMap, packageName) {
    const version = versionsMap.get(packageName);
    if (!version) {
        console.log("Failed to get version for package: ", packageName);
        process.exit(1);
    }
    return version;
}

async function checkConsistency(file, versionsMap) {
    console.log("Checking: ", file);
    const content = await fs.readFile(file);
    const json = JSON.parse(content);
    const version = getVersionForPackageOrThrow(versionsMap, json.name);

    for (const [name, versionInDep] of versionsMap) {
        const check = (x, version) => {
            if (version.includes("*")) {
                return;
            }

            if (versionInDep !== version) {
                console.log(
                    `Error, versions don't match: ${name}:${version} !== ${versionInDep}`,
                    file
                );
                process.exit(1);
            }
        };
        processDep(json.dependencies, name, check);
        processDep(json.devDependencies, name, check);
    }
}

async function bumpVersions(file, versionsMap) {
    console.log("Updating: ", file);
    let content = await fs.readFile(file);
    const json = JSON.parse(content);

    // bump dependencies
    for (const [name, version] of versionsMap) {
        const update = (x) => (x[name] = `workspace:${version}-${postfix}`);
        processDep(json.dependencies, name, update);
        processDep(json.devDependencies, name, update);
    }

    // also bump version in package itself
    const version = getVersionForPackageOrThrow(versionsMap, json.name);
    json.version = `${version}-${postfix}`;

    content = JSON.stringify(json, undefined, 4) + "\n";
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

    // always check consistency
    console.log("Checking versions consistency...");
    await processPackageJsons(packageJsons, versionsMap, checkConsistency);
    console.log("Versions are consistent");

    if (mode === "bump-version") {
        console.log("Adding postfix: ", postfix);
        await processPackageJsons(packageJsons, versionsMap, bumpVersions);
        console.log("Done");
    }
}

run();
