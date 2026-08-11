import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({ resolve: { alias: { '@web-toybox/toy-audio': resolve(import.meta.dirname, '../toy-audio/src/index.ts') } }, build: { outDir: resolve(import.meta.dirname, 'dist'), emptyOutDir: true, lib: { entry: resolve(import.meta.dirname, 'src/index.ts'), name: 'PaperFootball', formats: ['es','umd'], fileName: (format) => format === 'es' ? 'paper-football.js' : 'paper-football.umd.cjs' }, rollupOptions: { output: { exports: 'named' } } } });
