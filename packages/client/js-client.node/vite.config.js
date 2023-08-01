import {defineConfig} from 'vite'
import {resolve} from 'path';
import {builtinModules} from "module";
import { replaceCodePlugin } from "vite-plugin-replace";

export default defineConfig({
    build: {
        target: 'es2022',
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'JSClient',
        },
        rollupOptions: {
            external: builtinModules
        },
        commonjsOptions: {
            esmExternals: true,
            dynamicRequireRoot: '/Users/a.mamedov/WebstormProjects/js-client/node_modules/.pnpm',
            dynamicRequireTargets: ['./default-gateway@6.0.3/node_modules/default-gateway/*.js'],
            ignoreDynamicRequires: true,
        }
    },
    plugins: [replaceCodePlugin({
        replacements: [{from: 'require(`./${file}.js`)', to: ''}]
    })]
})