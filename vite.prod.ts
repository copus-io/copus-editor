/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {fileURLToPath, URL} from 'url';
// import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import react from '@vitejs/plugin-react';
import {createRequire} from 'node:module';
import {defineConfig} from 'vite';

// import moduleResolution from './shared/viteModuleResolution';
// import viteCopyEsm from './viteCopyEsm';

const require = createRequire(import.meta.url);

// https://vitejs.dev/config/
export default defineConfig(({command}) => {
  return {
    build: {
      target: 'esnext',
      outDir: 'dist/lib',
      rollupOptions: {
        external: ['react', 'react-dom'],
      },
      cssMinify: false,
      minify: false,
      lib: {
        entry: 'src/index.tsx',
        name: 'copus-editor',
        formats: ['es'],
        fileName: 'index',
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
    plugins: [react()],
  };
});
