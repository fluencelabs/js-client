import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'

// import { viteCommonjs } from '@originjs/vite-plugin-commonjs'

export default defineConfig({
  mode: 'development',
  build: {
    minify: false,
    lib: {
      entry: './src/index.ts',
      name: 'js-client',
      fileName: 'js-client',
    },
  },
  base: '',
  plugins: [
    tsconfigPaths(),
    // viteCommonjs()
  ],
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true,
        }),
      ],
      define: {
        global: 'globalThis',
      },
    },
  },
})
