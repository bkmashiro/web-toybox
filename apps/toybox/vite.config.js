import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const root = import.meta.dirname;

export default defineConfig({
  root,
  base: process.env.BASE_PATH ?? '/web-toybox/',
  resolve: {
    alias: {
      '@web-toybox/toy-audio': resolve(root, '../../packages/toy-audio/src/index.ts'),
      '@web-toybox/kendama': resolve(root, '../../packages/kendama/src/index.ts'),
      '@web-toybox/jacobs-ladder': resolve(root, '../../packages/jacobs-ladder/src/index.ts'),
      '@web-toybox/marble-maze': resolve(root, '../../packages/marble-maze/src/index.ts'),
      '@web-toybox/paper-football': resolve(root, '../../packages/paper-football/src/index.ts'),
      '@web-toybox/peg-solitaire': resolve(root, '../../packages/peg-solitaire/src/index.ts'),
      '@web-toybox/pinboard': resolve(root, '../../packages/pinboard/src/index.ts'),
      '@web-toybox/sliding-puzzle': resolve(root, '../../packages/sliding-puzzle/src/index.ts'),
      '@web-toybox/tangram': resolve(root, '../../packages/tangram/src/index.ts'),
      '@web-toybox/tin-frog': resolve(root, '../../packages/tin-frog/src/index.ts'),
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
        'toys/jacobs-ladder/index': resolve(root, 'toys/jacobs-ladder/index.html'),
        'toys/marble-maze/index': resolve(root, 'toys/marble-maze/index.html'),
        'toys/paper-football/index': resolve(root, 'toys/paper-football/index.html'),
        'toys/peg-solitaire/index': resolve(root, 'toys/peg-solitaire/index.html'),
        'toys/pinboard/index': resolve(root, 'toys/pinboard/index.html'),
        'toys/sliding-puzzle/index': resolve(root, 'toys/sliding-puzzle/index.html'),
        'toys/tangram/index': resolve(root, 'toys/tangram/index.html'),
        'toys/tin-frog/index': resolve(root, 'toys/tin-frog/index.html'),
        'toys/yoyo/index': resolve(root, 'toys/yoyo/index.html'),
      },
    },
  },
});
