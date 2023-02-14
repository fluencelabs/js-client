// @ts-check

// If won't use `@ts-check` - just remove that comments (with `@type` JSDoc below).

/** @type import('dts-bundle-generator/config-schema').OutputOptions */
const commonOutputParams = {
    inlineDeclareGlobals: false,
    sortNodes: true,
};

/** @type import('dts-bundle-generator/config-schema').BundlerConfig */
const config = {
    compilationOptions: {
        preferredConfigPath: './tsconfig.json',
    },

    entries: [
        {
            filePath: './src/index.ts',
            outFile: './dist/index.d.ts',
            noCheck: false,

            libraries: {
                /**
                 * Array of package names from @types to import typings from via the triple-slash reference directive.
                 * By default all packages are allowed and will be used according to their usages.
                 * Optional. Default value is `undefined`.
                 */
                // allowedTypesLibraries: ['node', '@types/node'],
                /**
                 * Array of package names from node_modules to import typings from.
                 * Used types will be imported using `import { First, Second } from 'library-name';`.
                 * By default all libraries will be imported (except inlined libraries and libraries from @types).
                 * Optional. Default value is `undefined`.
                 */
                importedLibraries: ['node', '@types/node'],
                /**
                 * Array of package names from node_modules to inline typings from.
                 * Used types will be inlined into the output file.
                 * Optional. Default value is `[]`.
                 */
                // inlinedLibraries: ['@my-company/package'],
            },

            output: commonOutputParams,
        },
    ],
};

module.exports = config;
