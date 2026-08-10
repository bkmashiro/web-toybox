import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@web-toybox/toy-audio': resolve(import.meta.dirname, 'packages/toy-audio/src/index.ts'),
    },
  },
});
