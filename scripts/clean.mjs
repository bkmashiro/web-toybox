import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
for (const target of ['site', 'packages/kendama/dist']) {
  await rm(resolve(root, target), { recursive: true, force: true });
}
