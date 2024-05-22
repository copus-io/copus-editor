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
import {replaceCodePlugin} from 'vite-plugin-replace';

// import moduleResolution from './shared/viteModuleResolution';
// import viteCopyEsm from './viteCopyEsm';

const require = createRequire(import.meta.url);

// https://vitejs.dev/config/
export default defineConfig(({command}) => {
  return {
    build: {
      outDir: 'build',
      rollupOptions: {
        input: {
          main: new URL('./index.html', import.meta.url).pathname,
        },
        onwarn(warning, warn) {
          if (
            warning.code === 'EVAL' &&
            warning.id &&
            /[\\/]node_modules[\\/]@excalidraw\/excalidraw[\\/]/.test(
              warning.id,
            )
          ) {
            return;
          }
          warn(warning);
        },
      },
    },
    define: {
      'process.env.IS_PREACT': process.env.IS_PREACT,
    },
    plugins: [
      replaceCodePlugin({
        replacements: [
          {
            from: /__DEV__/g,
            to: 'true',
          },
        ],
      }),
      react(),
      commonjs(),
    ],
    resolve: {
      alias: {
        shared: fileURLToPath(new URL('./src/shared', import.meta.url)),
      },
      // alias: moduleResolution(command === 'serve' ? 'source' : 'development'),
    },
  };
});
