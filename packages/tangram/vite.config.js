import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({ build: { outDir: resolve(import.meta.dirname, 'dist'), emptyOutDir: true, lib: { entry: resolve(import.meta.dirname, 'src/index.ts'), name: 'TangramPuzzle', formats: ['es','umd'], fileName: (format) => format === 'es' ? 'tangram.js' : 'tangram.umd.cjs' }, rollupOptions: { output: { exports: 'named' } } } });
