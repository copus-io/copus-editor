/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { fileURLToPath, URL } from 'url';
// import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import react from '@vitejs/plugin-react';
import { createRequire } from 'node:module';
import { defineConfig } from 'vite';

// import moduleResolution from './shared/viteModuleResolution';
// import viteCopyEsm from './viteCopyEsm';

const require = createRequire(import.meta.url);

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  return {
    build: {
      outDir: 'build',
      rollupOptions: {
        input: {
          main: new URL('./index.html', import.meta.url).pathname,
        },
      },
      target: ['chrome87', 'edge88', 'es2020', 'firefox78', 'safari14'],
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
    plugins: [
      react(),
      // commonjs(),
    ],
    resolve: {
      alias: {
        // shared: fileURLToPath(new URL('./src/shared', import.meta.url)),
      },
    },
  };
});
