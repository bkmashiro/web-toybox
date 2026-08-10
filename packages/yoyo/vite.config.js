import { defineConfig } from 'vite'; import { resolve } from 'node:path';
export default defineConfig({ build:{ outDir:resolve(import.meta.dirname,'dist'), emptyOutDir:true, lib:{ entry:resolve(import.meta.dirname,'src/index.ts'), name:'WebYoyo', formats:['es','umd'], fileName:f=>f==='es'?'yoyo.js':'yoyo.umd.cjs' }, rollupOptions:{ output:{ exports:'named' } } } });
