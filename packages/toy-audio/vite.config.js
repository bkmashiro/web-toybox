import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({ build: { lib: { entry: resolve(import.meta.dirname, 'src/index.ts'), name: 'WebToyAudio', formats: ['es', 'umd'], fileName: (format) => format === 'es' ? 'toy-audio.js' : 'toy-audio.umd.cjs' }, minify: 'esbuild', sourcemap: false } });
