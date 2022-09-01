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

    case "check-consistency":
        break;

    default:
        printUsage();
        process.exit(0);
}

const pathToPackages = "./packages/";
const allPackageJsons = [];
const packagesMap = new Map();

async function getFiles(thePath) {
    const entries = await fs.readdir(thePath, { withFileTypes: true });

    for (let file of entries) {
        if (file.name === "node_modules") {
            continue;
        }

        if (file.isDirectory()) {
            await getFiles(`${thePath}${file.name}/`);
        } else if (file.name === "package.json") {
            const packageJsonPath = path.join(__dirname, thePath, file.name);
            allPackageJsons.push(packageJsonPath);
        }
    }
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
    if (/^workspace\:/.test(obj[name])) {
        obj[name] = `workspace:${version}`;
    }
}

async function processVersions(file) {
    console.log("Updating: ", file);
    let content = await fs.readFile(file);
    const json = JSON.parse(content);
    const newPackageVersion = packagesMap.get(json.name);
    if (!newPackageVersion) {
        console.log("Failed to get version for package: ", file);
        process.exit(1);
    }

    const consistencyErrors = [];
    for (const [name, version] of packagesMap) {
        if (isWorkspaceDep(json.dependencies, name, version)) {
            if()
        }

        if (isWorkspaceDep(json.devDependencies, name, version)) {

        }
    }

    json.version = newPackageVersion;
    for (const [name, version] of packagesMap) {
        if (mod === "check-consistency") {
        } else {
            isWorkspaceDep(json.dependencies, name, version);
            isWorkspaceDep(json.devDependencies, name, version);
        }
    }
    content = JSON.stringify(json, undefined, 4);
    await fs.writeFile(file, content);
}

async function run() {
    await getFiles(pathToPackages);
    for (let file of allPackageJsons) {
        // console.log("Reading data from: ", file);
        const [name, version] = await getVersion(file);
        const newVersion = `${version}${postfix}`;
        packagesMap.set(name, newVersion);
    }
    console.log("Bumping versions: ", packagesMap);
    for (let file of allPackageJsons) {
        processVersions(file);
    }
}

run();
