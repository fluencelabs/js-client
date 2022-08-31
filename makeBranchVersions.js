const fs = require("fs").promises;
const path = require("path");

const postfix = "-bla-bla";

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

async function updateVersions(file) {
    let content = await fs.readFile(file);
    const json = JSON.parse(content);
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
        updateVersions(file);
    }
}

run();
