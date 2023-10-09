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

interface PackageJsonContent {
    dependencies: Record<string, string | undefined>;
    devDependencies: Record<string, string | undefined>;
}

// This will be substituted in build phase
const packageJsonContentString = `__PACKAGE_JSON_CONTENT__`;
let parsedPackageJsonContent: PackageJsonContent | undefined;

const PRIMARY_CDN = "https://unpkg.com/";

export async function fetchResource(pkg: string, assetPath: string) {
    const packageJsonContent =
        parsedPackageJsonContent ??
        // TODO: Should be validated
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        (parsedPackageJsonContent = JSON.parse(
            packageJsonContentString,
        ) as PackageJsonContent);

    const version =
        packageJsonContent.dependencies[pkg] ??
        packageJsonContent.devDependencies[pkg];

    if (version === undefined) {
        const availableDeps = [
            ...Object.keys(packageJsonContent.dependencies),
            ...Object.keys(packageJsonContent.devDependencies),
        ];

        throw new Error(
            `Cannot find version of ${pkg} in package.json. Available versions: ${availableDeps.join(
                ",",
            )}`,
        );
    }

    const refinedAssetPath = assetPath.startsWith("/")
        ? assetPath.slice(1)
        : assetPath;

    return fetch(
        new globalThis.URL(
            `${pkg}@${version}/` + refinedAssetPath,
            PRIMARY_CDN,
        ),
    );
}
