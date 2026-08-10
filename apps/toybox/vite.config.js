import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const root = import.meta.dirname;

export default defineConfig({
  root,
  base: process.env.BASE_PATH ?? '/web-toybox/',
  resolve: {
    alias: {
      '@web-toybox/kendama': resolve(root, '../../packages/kendama/src/index.ts'),
      '@web-toybox/yoyo': resolve(root, '../../packages/yoyo/src/index.ts'),
    },
  },
  build: {
    outDir: resolve(root, '../../site'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(root, 'index.html'),
        'toys/kendama/index': resolve(root, 'toys/kendama/index.html'),
        'toys/yoyo/index': resolve(root, 'toys/yoyo/index.html'),
      },
    },
  },
});
