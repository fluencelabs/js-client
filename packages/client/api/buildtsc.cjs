const tsc = require('tsc-prog');

tsc.build({
    basePath: __dirname,
    configFilePath: 'tsconfig.json',
    compilerOptions: {
        declaration: true, // must be set
    },
    bundleDeclaration: {
        entryPoint: './index.d.ts', // relative to the OUTPUT directory ('dist' here),
        globals: true, // default: true
    },
});
