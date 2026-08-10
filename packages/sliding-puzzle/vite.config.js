import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({ build: { outDir: resolve(import.meta.dirname, 'dist'), emptyOutDir: true, lib: { entry: resolve(import.meta.dirname, 'src/index.ts'), name: 'WebSlidingPuzzle', formats: ['es','umd'], fileName: (format) => format === 'es' ? 'sliding-puzzle.js' : 'sliding-puzzle.umd.cjs' }, rollupOptions: { output: { exports: 'named' } } } });
